import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const BoardContext = createContext(null);

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
}

export function BoardProvider({ children }) {
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [labels, setLabels] = useState([]);
  const [comments, setComments] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);

  const fetchBoardData = useCallback(async () => {
    setLoading(true);
    const [colsRes, cardsRes, labelsRes, commentsRes, asgnRes, lblRes] = await Promise.all([
      supabase.from('columns').select('*').order('position', { ascending: true }),
      supabase.from('cards').select('*').order('position', { ascending: true }),
      supabase.from('labels').select('*'),
      supabase.from('comments').select('*'),
      supabase.from('card_assignees').select('*'),
      supabase.from('card_labels').select('*'),
    ]);

    if (colsRes.data) setColumns(colsRes.data);
    if (labelsRes.data) setLabels(labelsRes.data);
    if (commentsRes.data) setComments(commentsRes.data);

    if (cardsRes.data) {
      // reconstruct arrays
      const formattedCards = cardsRes.data.map(c => {
        const cAssignees = asgnRes.data?.filter(a => a.cardId === c.id).map(a => a.userId) || [];
        const cLabels = lblRes.data?.filter(l => l.cardId === c.id).map(l => l.labelId) || [];
        return { ...c, assignees: cAssignees, labels: cLabels };
      });
      setCards(formattedCards);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const addCard = useCallback(async (columnId, cardData) => {
    const newCardId = `card-${Date.now()}`;
    const newCard = {
      id: newCardId,
      columnId,
      position: cards.filter(c => c.columnId === columnId).length,
      createdAt: new Date().toISOString(),
      commentsCount: 0,
      attachmentsCount: 0,
      subtasksTotal: 0,
      subtasksDone: 0,
      archived: false,
      ...cardData,
    };

    // Separate arrays for insertion
    const { assignees, labels, ...dbCard } = newCard;

    await supabase.from('cards').insert(dbCard);
    
    // Optimistic update
    setCards((prev) => [...prev, { ...dbCard, assignees: assignees || [], labels: labels || [] }]);
    return newCard;
  }, [cards]);

  const updateCard = useCallback(async (cardId, updates) => {
    // Optimistic update
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, ...updates } : card))
    );
    
    const dbUpdates = { ...updates };
    delete dbUpdates.assignees;
    delete dbUpdates.labels;
    
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('cards').update(dbUpdates).eq('id', cardId);
    }
  }, []);

  const moveCard = useCallback(async (cardId, targetColumnId, targetPosition) => {
    setCards((prev) => {
      const updated = prev.map((card) => {
        if (card.id !== cardId) return card;
        return { ...card, columnId: targetColumnId, position: targetPosition };
      });
      return updated;
    });
    await supabase.from('cards').update({ columnId: targetColumnId, position: targetPosition }).eq('id', cardId);
  }, []);

  const deleteCard = useCallback(async (cardId) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId));
    await supabase.from('cards').delete().eq('id', cardId);
  }, []);

  const archiveCard = useCallback(async (cardId) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, archived: true } : card
      )
    );
    await supabase.from('cards').update({ archived: true }).eq('id', cardId);
  }, []);

  const uploadFile = async (file) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const addComment = useCallback(async (cardId, userId, content, attachments = []) => {
    const newComment = {
      id: `comment-${Date.now()}`,
      cardId,
      userId,
      content,
      attachments, // Expecting clean objects (no File pointers)
      createdAt: new Date().toISOString()
    };
    const { error } = await supabase.from('comments').insert(newComment);
    if (error) {
      console.error('Error inserting comment:', error);
      throw error;
    }
    setComments((prev) => [...prev, newComment]);
    
    const targetCard = cards.find(c => c.id === cardId);
    if(targetCard) {
      const newCount = (targetCard.commentsCount || 0) + 1;
      await supabase.from('cards').update({ commentsCount: newCount }).eq('id', cardId);
      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, commentsCount: newCount } : card
        )
      );
    }
    return newComment;
  }, [cards]);

  const updateComment = useCallback(async (commentId, content) => {
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, content } : c));
    await supabase.from('comments').update({ content }).eq('id', commentId);
  }, []);

  const deleteComment = useCallback(async (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    await supabase.from('comments').delete().eq('id', commentId);
  }, []);

  const updateLabel = useCallback(async (labelId, updates) => {
    setLabels((prev) => prev.map((l) => l.id === labelId ? { ...l, ...updates } : l));
    await supabase.from('labels').update(updates).eq('id', labelId);
  }, []);

  const clearColumn = useCallback(async (columnId) => {
    setCards((prev) => prev.filter((card) => card.columnId !== columnId));
    await supabase.from('cards').delete().eq('columnId', columnId);
  }, []);

  const deleteColumn = useCallback(async (columnId) => {
    setColumns((prev) => prev.filter((col) => col.id !== columnId));
    await supabase.from('columns').delete().eq('id', columnId);
  }, []);

  const updateColumn = useCallback(async (columnId, name) => {
    setColumns((prev) => prev.map((col) => col.id === columnId ? { ...col, name } : col));
    await supabase.from('columns').update({ name }).eq('id', columnId);
  }, []);

  const duplicateColumn = useCallback(async (columnId) => {
    const colToDuplicate = columns.find(c => c.id === columnId);
    if (!colToDuplicate) return;
    
    const newColId = `col-${Date.now()}`;
    const newPosition = colToDuplicate.position + 1;
    
    // Update positions of columns after this one
    const updatedColumns = columns.map(col => {
      if (col.position >= newPosition) {
        return { ...col, position: col.position + 1 };
      }
      return col;
    });
    
    const newCol = { ...colToDuplicate, id: newColId, name: `${colToDuplicate.name} (Copia)`, position: newPosition };
    
    // Final state
    const finalColumns = [...updatedColumns, newCol].sort((a,b) => a.position - b.position);
    setColumns(finalColumns);
    
    // Sync to DB
    await Promise.all([
      supabase.from('columns').insert(newCol),
      ...updatedColumns.filter(c => c.position > colToDuplicate.position).map(c => 
        supabase.from('columns').update({ position: c.position }).eq('id', c.id)
      )
    ]);
  }, [columns]);

  const moveColumn = useCallback(async (columnId, newPosition) => {
    setColumns((prev) => {
      const sorted = [...prev].sort((a,b) => a.position - b.position);
      const oldIndex = sorted.findIndex(c => c.id === columnId);
      const [movedCol] = sorted.splice(oldIndex, 1);
      sorted.splice(newPosition, 0, movedCol);
      
      const updated = sorted.map((c, i) => ({ ...c, position: i }));
      // Sync each position change to DB
      updated.forEach(async (c) => {
        await supabase.from('columns').update({ position: c.position }).eq('id', c.id);
      });
      return updated;
    });
  }, []);

  const getColumnsWithCards = useCallback(() => {
    return columns.map((column) => {
      let columnCards = cards
        .filter((card) => card.columnId === column.id && !card.archived)
        .sort((a, b) => a.position - b.position);

      if (searchQuery) {
        columnCards = columnCards.filter(card => 
          card.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
        
      return {
        ...column,
        cards: columnCards,
      };
    });
  }, [columns, cards, searchQuery]);

  const value = useMemo(
    () => ({
      columns,
      cards,
      labels,
      selectedCard,
      setSelectedCard,
      searchQuery,
      setSearchQuery,
      addCard,
      updateCard,
      moveCard,
      deleteCard,
      archiveCard,
      addComment,
      updateComment,
      deleteComment,
      updateLabel,
      updateLabel,
      clearColumn,
      deleteColumn,
      updateColumn,
      duplicateColumn,
      moveColumn,
      getColumnsWithCards,
      highlightedCommentId,
      setHighlightedCommentId,
      comments,
      loading,
      uploadFile
    }),
    [
      columns,
      cards,
      labels,
      selectedCard,
      setSelectedCard,
      searchQuery,
      setSearchQuery,
      addCard,
      updateCard,
      moveCard,
      deleteCard,
      archiveCard,
      addComment,
      updateComment,
      deleteComment,
      updateLabel,
      clearColumn,
      deleteColumn,
      updateColumn,
      duplicateColumn,
      moveColumn,
      getColumnsWithCards,
      highlightedCommentId,
      setHighlightedCommentId,
      comments,
      loading
    ]
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}
