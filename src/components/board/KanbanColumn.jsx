import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBoard } from '../../context/BoardContext';
import KanbanCard from './KanbanCard';
import Modal from '../ui/Modal';
import './KanbanColumn.css';

/**
 * Kanban column with droppable area, header with count, and add card button.
 * Sortable itself to allow horizontal reordering.
 */

export default function KanbanColumn({ column, cards, onAddCard }) {
  const { 
    setNodeRef: setSortableRef, 
    attributes, 
    listeners, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({
    id: column.id,
    data: { type: 'column', column },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', column },
  });

  const { activeRole } = useAuth();
  const { updateColumn, duplicateColumn, deleteColumn } = useBoard();
  const isAdmin = activeRole === 'admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(column.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRename = () => {
    if (!isRenaming) return;
    if (newName.trim() !== column.name && newName.trim() !== '') {
      updateColumn(column.id, newName.trim());
    } else {
      setNewName(column.name); // reset to original if empty
    }
    setIsRenaming(false);
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    '--column-accent': column.accentColor
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setIsMenuOpen(false);
  };

  const confirmDelete = () => {
    deleteColumn(column.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''} ${isDragging ? 'kanban-column--dragging' : ''}`}
    >
      <div className="kanban-column__header" {...(isRenaming ? {} : { ...attributes, ...listeners })}>
        <div className="kanban-column__header-left">
          <span className="kanban-column__accent-bar" />
          {isRenaming ? (
            <input 
              value={newName} 
              onChange={e => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => {
                e.stopPropagation();
                if(e.key === 'Enter') {
                  e.preventDefault();
                  handleRename();
                }
                if(e.key === 'Escape') {
                  setIsRenaming(false);
                  setNewName(column.name);
                }
              }}
              autoFocus
              style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '2px 4px', maxWidth: '140px', width: '100%', pointerEvents: 'auto' }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <h3 className="kanban-column__title">{column.name}</h3>
          )}
          <span className="kanban-column__count">
            ({String(cards.length).padStart(2, '0')})
          </span>
        </div>
        <div className="kanban-column__header-actions" ref={menuRef} style={{ position: 'relative', pointerEvents: 'auto' }} onClick={e => e.stopPropagation()}>
          {isAdmin && (
            <button
              className="kanban-column__add-btn"
              onClick={() => onAddCard(column.id)}
              aria-label={`Agregar tarjeta a ${column.name}`}
            >
              <Plus size={16} />
            </button>
          )}
          {isAdmin && (
            <button className="kanban-column__menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Opciones de columna">
              <MoreVertical size={16} />
            </button>
          )}
          {isMenuOpen && (
            <div style={{ position: 'absolute', top: '100%', right: '0', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px', zIndex: 9999, display: 'flex', flexDirection: 'column', minWidth: '140px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', gap: '2px' }}>
              <button onClick={() => { setIsRenaming(true); setIsMenuOpen(false); }} style={{ background: 'none', border: 'none', textAlign: 'left', padding: '8px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', color: 'var(--color-text-primary)' }}>Renombrar</button>
              <button 
                onClick={() => { duplicateColumn(column.id); setIsMenuOpen(false); }} 
                style={{ background: 'none', border: 'none', textAlign: 'left', padding: '8px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', color: 'var(--color-text-primary)' }}
              >
                Duplicar
              </button>
              <button 
                onClick={handleDelete} 
                style={{ color: '#e74c3c', background: 'none', border: 'none', textAlign: 'left', padding: '8px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px' }}
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={setDroppableRef}
        className="kanban-column__cards"
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card, index) => (
            <KanbanCard key={card.id} card={card} index={index} />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="kanban-column__empty">
            <p>No hay tarjetas</p>
            {isAdmin && (
              <button
                className="kanban-column__empty-add"
                onClick={() => onAddCard(column.id)}
              >
                <Plus size={14} />
                Agregar tarjeta
              </button>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="" size="sm">
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-primary)', fontSize: '15px', lineHeight: '1.5' }}>
            ¿Seguro que deseas eliminar la columna <b>{column.name}</b>?<br /><br />
            Se perderán permanentemente TODAS las tarjetas añadidas a ella.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
            <button 
              onClick={confirmDelete}
              style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#e74c3c', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
            >
              Eliminar
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              style={{ padding: '10px 20px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600', color: 'var(--color-text-secondary)', fontSize: '14px' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
