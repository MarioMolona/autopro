import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useBoard } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import CardDetailModal from './CardDetailModal';
import CreateCardModal from './CreateCardModal';
import './KanbanBoard.css';

/**
 * Main Kanban board with DnD context, columns, and card modals.
 * Handles drag events to move cards between columns and reorder columns.
 */
export default function KanbanBoard() {
  const { getColumnsWithCards, moveCard, moveColumn, selectedCard, setSelectedCard } = useBoard();
  const { activeRole } = useAuth();
  const [activeCard, setActiveCard] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [createModalColumnId, setCreateModalColumnId] = useState(null);

  const isViewer = activeRole === 'viewer';

  const columnsWithCards = getColumnsWithCards();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeSensors = isViewer ? [] : sensors;

  const handleDragStart = useCallback((event) => {
    if (isViewer) return;
    const { active } = event;
    if (active.data?.current?.type === 'card') {
      setActiveCard(active.data.current.card);
    } else if (active.data?.current?.type === 'column') {
      setActiveColumn(active.data.current.column);
    }
  }, [isViewer]);

  const handleDragOver = useCallback(() => {
    // Visual feedback is handled by the droppable highlight
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveCard(null);
      setActiveColumn(null);

      if (!over) return;

      const activeId = active.id;
      const overId = over.id;

      if (active.data?.current?.type === 'column') {
        if (activeId !== overId) {
          const oldIndex = columnsWithCards.findIndex((c) => c.id === activeId);
          const newIndex = columnsWithCards.findIndex((c) => c.id === overId);
          moveColumn(activeId, newIndex);
        }
        return;
      }

      if (active.data?.current?.type === 'card') {
        const activeData = active.data.current;
        let targetColumnId;
        let targetPosition = 0;

        if (over.data?.current?.type === 'column' || over.id.startsWith('col-')) {
          targetColumnId = over.id;
          const colCards = columnsWithCards.find((c) => c.id === targetColumnId)?.cards || [];
          targetPosition = colCards.length;
        } else if (over.data?.current?.type === 'card') {
          const overCard = over.data.current.card;
          targetColumnId = overCard.columnId;
          targetPosition = overCard.position;
        }

        if (activeData.card.columnId === targetColumnId && activeData.card.position === targetPosition) {
          return;
        }

        moveCard(activeId, targetColumnId, targetPosition);
      }
    },
    [moveCard, moveColumn, columnsWithCards]
  );

  const handleAddCard = useCallback((columnId) => {
    setCreateModalColumnId(columnId);
  }, []);

  return (
    <>
      <DndContext
        sensors={activeSensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div 
          className="kanban-board" 
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
        >
          <SortableContext 
            items={columnsWithCards.map(c => c.id)} 
            strategy={horizontalListSortingStrategy}
          >
            {columnsWithCards.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={column.cards}
                onAddCard={handleAddCard}
              />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="kanban-card-overlay">
              <KanbanCard card={activeCard} index={0} />
            </div>
          ) : activeColumn ? (
            <div className="kanban-column-overlay" style={{ opacity: 0.8 }}>
               <KanbanColumn column={activeColumn} cards={activeColumn.cards} onAddCard={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {createModalColumnId && (
        <CreateCardModal
          columnId={createModalColumnId}
          onClose={() => setCreateModalColumnId(null)}
        />
      )}
    </>
  );
}
