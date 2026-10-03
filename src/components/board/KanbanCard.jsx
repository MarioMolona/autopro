import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Calendar, MessageSquare, Paperclip, CheckSquare } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { useBoard } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';
import './KanbanCard.css';

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', color: 'var(--color-priority-urgent)' },
  high: { label: 'Alta', color: 'var(--color-priority-high)' },
  medium: { label: 'Media', color: 'var(--color-priority-medium)' },
  low: { label: 'Baja', color: 'var(--color-priority-low)' },
};

/**
 * Kanban card component with drag sorting, metadata display, and click-to-open.
 * Shows title, date, labels, assignee avatars, and activity counters.
 */
export default function KanbanCard({ card, index }) {
  const { setSelectedCard, deleteCard, addCard, labels: contextLabels } = useBoard();
  const { activeRole, allUsers } = useAuth();
  const isAdmin = activeRole === 'admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const getLabel = (id) => contextLabels.find(l => l.id === id);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priority = PRIORITY_CONFIG[card.priority];
  const assignees = card.assignees.map(id => allUsers.find(u => u.id === id)).filter(Boolean);
  const labels = card.labels.map(getLabel).filter(Boolean);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleCardClick = (e) => {
    if (isDragging) return;
    setSelectedCard(card);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'kanban-card--dragging' : ''}`}
      onClick={handleCardClick}
      {...attributes}
      {...listeners}
    >
      <div className="kanban-card__header">
        <h4 className="kanban-card__title">
          <span className="kanban-card__index">{index + 1}.</span>
          {card.title}
        </h4>
        <div style={{ position: 'relative' }} ref={menuRef}>
          {isAdmin && (
            <button
              className="kanban-card__menu"
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              aria-label="Opciones de tarjeta"
            >
              <MoreVertical size={14} />
            </button>
          )}
          {isMenuOpen && isAdmin && (
            <div 
              style={{
                position: 'absolute', top: '100%', right: '0', 
                background: 'var(--color-bg-base)', border: '1px solid var(--color-border)',
                borderRadius: '6px', padding: '4px', zIndex: 10, minWidth: '120px',
                boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: '2px'
              }}
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  const { id, ...data } = card;
                  addCard(card.columnId, { ...data, title: card.title + " (Copia)" });
                  setIsMenuOpen(false);
                }}
                style={{ background: 'none', border: 'none', textAlign: 'left', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px' }}
                onMouseOver={(e) => e.target.style.background = 'var(--color-bg-elevated)'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                Duplicar
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  deleteCard(card.id); 
                  setIsMenuOpen(false);
                }}
                style={{ color: '#e74c3c', background: 'none', border: 'none', textAlign: 'left', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px' }}
                onMouseOver={(e) => e.target.style.background = 'rgba(231, 76, 60, 0.1)'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="kanban-card__meta">
        <span className="kanban-card__date">
          <Calendar size={12} />
          {formatDate(card.dueDate)}
        </span>
        {priority && (
          <span
            className="kanban-card__priority-dot"
            style={{ background: priority.color }}
            title={priority.label}
          />
        )}
      </div>

      {labels.length > 0 && (
        <div className="kanban-card__labels">
          {labels.slice(0, 3).map((label) => (
            <Badge key={label.id} color={label.color}>
              {label.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="kanban-card__footer">
        <div className="kanban-card__assignees">
          {assignees.slice(0, 3).map((user) => (
            <Avatar
              key={user.id}
              user={user}
              size="xs"
              showAiBadge={user.isAiAgent}
            />
          ))}
        </div>

        <div className="kanban-card__counters">
          {card.subtasksTotal > 0 && (
            <span className="kanban-card__counter" title="Subtareas">
              <CheckSquare size={12} />
              {card.subtasksDone}/{card.subtasksTotal}
            </span>
          )}
          {card.commentsCount > 0 && (
            <span className="kanban-card__counter" title="Comentarios">
              <MessageSquare size={12} />
              {card.commentsCount}
            </span>
          )}
          {card.attachments?.length > 0 && (
            <span className="kanban-card__counter" title="Archivos">
              <Paperclip size={12} />
              {card.attachments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
