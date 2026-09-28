import { useState } from 'react';
import { useBoard } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';
import { MOCK_LABELS } from '../../data/mockData';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import './CreateCardModal.css';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baja', color: 'var(--color-priority-low)' },
  { value: 'medium', label: 'Media', color: 'var(--color-priority-medium)' },
  { value: 'high', label: 'Alta', color: 'var(--color-priority-high)' },
  { value: 'urgent', label: 'Urgente', color: 'var(--color-priority-urgent)' },
];

/**
 * Modal for creating a new card.
 * Collects title, description, priority, due date, assignees, and labels.
 */
export default function CreateCardModal({ columnId, onClose }) {
  const { addCard, columns } = useBoard();
  const { currentUser, allUsers } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([currentUser.id]);
  const [selectedLabels, setSelectedLabels] = useState([]);

  const column = columns.find((c) => c.id === columnId);

  const toggleAssignee = (userId) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleLabel = (labelId) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    addCard(columnId, {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate || null,
      createdBy: currentUser.id,
      assignees: selectedAssignees,
      labels: selectedLabels,
    });

    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Nueva tarjeta en "${column?.name}"`} size="md">
      <form className="create-card-form" onSubmit={handleSubmit}>
        {/* Title */}
        <div className="create-card-form__field">
          <label className="create-card-form__label" htmlFor="card-title">
            Título *
          </label>
          <input
            id="card-title"
            type="text"
            className="create-card-form__input"
            placeholder="Título de la tarjeta"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Description */}
        <div className="create-card-form__field">
          <label className="create-card-form__label" htmlFor="card-description">
            Descripción
          </label>
          <textarea
            id="card-description"
            className="create-card-form__textarea"
            placeholder="Describe el contenido de la tarjeta..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Priority & Due Date row */}
        <div className="create-card-form__row">
          <div className="create-card-form__field">
            <label className="create-card-form__label" htmlFor="card-priority">
              Prioridad
            </label>
            <select
              id="card-priority"
              className="create-card-form__select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="create-card-form__field">
            <label className="create-card-form__label" htmlFor="card-due-date">
              Fecha límite
            </label>
            <input
              id="card-due-date"
              type="date"
              className="create-card-form__input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Assignees */}
        <div className="create-card-form__field">
          <label className="create-card-form__label">Asignar a</label>
          <div className="create-card-form__chips">
            {allUsers.filter((u) => u.isActive).map((user) => (
              <button
                key={user.id}
                type="button"
                className={`create-card-form__chip ${selectedAssignees.includes(user.id) ? 'create-card-form__chip--selected' : ''}`}
                onClick={() => toggleAssignee(user.id)}
              >
                <Avatar user={user} size="xs" showAiBadge={user.isAiAgent} />
                <span>{user.fullName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Labels */}
        <div className="create-card-form__field">
          <label className="create-card-form__label">Etiquetas</label>
          <div className="create-card-form__chips">
            {MOCK_LABELS.map((label) => (
              <button
                key={label.id}
                type="button"
                className={`create-card-form__chip ${selectedLabels.includes(label.id) ? 'create-card-form__chip--selected' : ''}`}
                onClick={() => toggleLabel(label.id)}
              >
                <Badge color={label.color}>{label.name}</Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="create-card-form__actions">
          <button
            type="button"
            className="create-card-form__cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="create-card-form__submit"
            disabled={!title.trim()}
          >
            Crear tarjeta
          </button>
        </div>
      </form>
    </Modal>
  );
}
