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

    // Supabase Realtime Subscriptions
    const channel = supabase.channel('board-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, payload => {
        if (payload.eventType === 'INSERT') {
          setCards(prev => {
            if (prev.find(c => c.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, assignees: [], labels: [] }];
          });
        } else if (payload.eventType === 'UPDATE') {
          setCards(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
        } else if (payload.eventType === 'DELETE') {
          setCards(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns' }, payload => {
        if (payload.eventType === 'INSERT') {
          setColumns(prev => {
            if (prev.find(c => c.id === payload.new.id)) return prev;
            return [...prev, payload.new].sort((a,b) => a.position - b.position);
          });
        } else if (payload.eventType === 'UPDATE') {
          setColumns(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c).sort((a,b) => a.position - b.position));
        } else if (payload.eventType === 'DELETE') {
          setColumns(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, payload => {
        if (payload.eventType === 'INSERT') {
          setComments(prev => {
            if (prev.find(c => c.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'UPDATE') {
          setComments(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
        } else if (payload.eventType === 'DELETE') {
          setComments(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBoardData]);

  const addCard = useCallback(async (columnId, cardData) => {
    const tempId = crypto.randomUUID();
    const newCard = {
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

    const { assignees, labels, ...dbCard } = newCard;
    
    // Optimistic UI
    setCards((prev) => [...prev, { ...dbCard, id: tempId, assignees: assignees || [], labels: labels || [] }]);

    const { data, error } = await supabase.from('cards').insert(dbCard).select().single();
    if (error) {
      setCards(prev => prev.filter(c => c.id !== tempId)); // Rollback
      alert('Error al crear la tarjeta: ' + error.message);
      return null;
    }
    
    // Replace temp ID with real ID
    setCards(prev => prev.map(c => c.id === tempId ? { ...c, id: data.id, assignees: assignees || [], labels: labels || [] } : c));
    return data;
  }, [cards]);

  const updateCard = useCallback(async (cardId, updates) => {
    const prevCards = [...cards];
    
    // Optimistic update
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, ...updates } : card))
    );
    
    const dbUpdates = { ...updates };
    delete dbUpdates.assignees;
    delete dbUpdates.labels;
    
    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('cards').update(dbUpdates).eq('id', cardId);
      if (error) {
        setCards(prevCards); // Rollback
        alert('Error al actualizar la tarjeta: ' + error.message);
      }
    }
  }, [cards]);

  const moveCard = useCallback(async (cardId, targetColumnId, targetPosition) => {
    const prevCards = [...cards];
    
    // Optimistic update
    setCards((prev) => {
      return prev.map((card) => {
        if (card.id !== cardId) return card;
        return { ...card, columnId: targetColumnId, position: targetPosition };
      });
    });
    
    const { error } = await supabase.from('cards').update({ columnId: targetColumnId, position: targetPosition }).eq('id', cardId);
    if (error) {
      setCards(prevCards); // Rollback
      alert('Error al mover la tarjeta: ' + error.message);
    }
  }, [cards]);

  const deleteCard = useCallback(async (cardId) => {
    const prevCards = [...cards];
    setCards((prev) => prev.filter((card) => card.id !== cardId));
    
    const { error } = await supabase.from('cards').delete().eq('id', cardId);
    if (error) {
      setCards(prevCards); // Rollback
      alert('Error al eliminar la tarjeta: ' + error.message);
    }
  }, [cards]);

  const archiveCard = useCallback(async (cardId) => {
    const prevCards = [...cards];
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, archived: true } : card
      )
    );
    
    const { error } = await supabase.from('cards').update({ archived: true }).eq('id', cardId);
    if (error) {
      setCards(prevCards); // Rollback
      alert('Error al archivar la tarjeta: ' + error.message);
    }
  }, [cards]);

  const uploadFile = async (file) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
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
    const tempId = crypto.randomUUID();
    const newComment = {
      cardId,
      userId,
      content,
      attachments, 
      createdAt: new Date().toISOString()
    };
    
    setComments((prev) => [...prev, { ...newComment, id: tempId }]);
    
    const { data, error } = await supabase.from('comments').insert(newComment).select().single();
    if (error) {
      setComments(prev => prev.filter(c => c.id !== tempId)); // Rollback
      alert('Error al añadir el comentario: ' + error.message);
      throw error;
    }
    
    setComments((prev) => prev.map(c => c.id === tempId ? data : c));
    // Counters are automatically updated via Postgres triggers, and reflected via Realtime
    return data;
  }, []);

  const updateComment = useCallback(async (commentId, content) => {
    const prevComments = [...comments];
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, content } : c));
    
    const { error } = await supabase.from('comments').update({ content }).eq('id', commentId);
    if (error) {
      setComments(prevComments); // Rollback
      alert('Error al actualizar el comentario: ' + error.message);
    }
  }, [comments]);

  const deleteComment = useCallback(async (commentId) => {
    const prevComments = [...comments];
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) {
      setComments(prevComments); // Rollback
      alert('Error al eliminar el comentario: ' + error.message);
    }
  }, [comments]);

  const updateLabel = useCallback(async (labelId, updates) => {
    setLabels((prev) => prev.map((l) => l.id === labelId ? { ...l, ...updates } : l));
    await supabase.from('labels').update(updates).eq('id', labelId);
  }, []);

  const clearColumn = useCallback(async (columnId) => {
    const prevCards = [...cards];
    setCards((prev) => prev.filter((card) => card.columnId !== columnId));
    
    const { error } = await supabase.from('cards').delete().eq('columnId', columnId);
    if (error) {
      setCards(prevCards); // Rollback
      alert('Error al limpiar la columna: ' + error.message);
    }
  }, [cards]);

  const deleteColumn = useCallback(async (columnId) => {
    const prevCols = [...columns];
    setColumns((prev) => prev.filter((col) => col.id !== columnId));
    
    const { error } = await supabase.from('columns').delete().eq('id', columnId);
    if (error) {
      setColumns(prevCols); // Rollback
      alert('Error al eliminar la columna: ' + error.message);
    }
  }, [columns]);

  const updateColumn = useCallback(async (columnId, name) => {
    const prevCols = [...columns];
    setColumns((prev) => prev.map((col) => col.id === columnId ? { ...col, name } : col));
    
    const { error } = await supabase.from('columns').update({ name }).eq('id', columnId);
    if (error) {
      setColumns(prevCols); // Rollback
      alert('Error al actualizar la columna: ' + error.message);
    }
  }, [columns]);

  const duplicateColumn = useCallback(async (columnId) => {
    const colToDuplicate = columns.find(c => c.id === columnId);
    if (!colToDuplicate) return;
    
    const prevCols = [...columns];
    const newPosition = colToDuplicate.position + 1;
    
    const updatedColumns = columns.map(col => {
      if (col.position >= newPosition) {
        return { ...col, position: col.position + 1 };
      }
      return col;
    });
    
    const tempId = crypto.randomUUID();
    const newCol = { ...colToDuplicate, id: tempId, name: `${colToDuplicate.name} (Copia)`, position: newPosition };
    
    const finalColumns = [...updatedColumns, newCol].sort((a,b) => a.position - b.position);
    setColumns(finalColumns);
    
    const { id, ...dbCol } = newCol;
    
    const promises = [
      supabase.from('columns').insert(dbCol).select().single(),
      ...updatedColumns.filter(c => c.position > colToDuplicate.position).map(c => 
        supabase.from('columns').update({ position: c.position }).eq('id', c.id)
      )
    ];

    const results = await Promise.all(promises);
    const insertResult = results[0];
    const errors = results.filter(r => r.error);
    
    if (errors.length > 0) {
      setColumns(prevCols); // Rollback
      alert('Error al duplicar la columna: ' + errors[0].error.message);
    } else {
      setColumns(prev => prev.map(c => c.id === tempId ? insertResult.data : c));
    }
  }, [columns]);

  const moveColumn = useCallback(async (columnId, newPosition) => {
    const prevColumns = [...columns];
    
    const sorted = [...columns].sort((a,b) => a.position - b.position);
    const oldIndex = sorted.findIndex(c => c.id === columnId);
    if (oldIndex === -1) return;
    
    const [movedCol] = sorted.splice(oldIndex, 1);
    sorted.splice(newPosition, 0, movedCol);
    
    const updated = sorted.map((c, i) => ({ ...c, position: i }));
    setColumns(updated); // Optimistic UI
    
    try {
      const promises = updated.map(c => 
        supabase.from('columns').update({ position: c.position }).eq('id', c.id)
      );
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    } catch (err) {
      setColumns(prevColumns); // Rollback
      alert('Error al mover la columna: ' + err.message);
    }
  }, [columns]);

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
