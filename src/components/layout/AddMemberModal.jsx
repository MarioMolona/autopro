import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import './AddMemberModal.css';

/**
 * Modal to invite new members to the project.
 * Simplified UI for demonstration.
 */
export default function AddMemberModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would call an API
    console.log('Invitando a:', email, 'con rol:', role);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invitar Miembro" size="sm">
      <form className="add-member-form" onSubmit={handleSubmit}>
        <div className="add-member-form__field">
          <label className="add-member-form__label" htmlFor="member-email">
            Correo Electrónico
          </label>
          <input
            id="member-email"
            type="email"
            className="add-member-form__input"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="add-member-form__field">
          <label className="add-member-form__label" htmlFor="member-role">
            Rol en el Proyecto
          </label>
          <select
            id="member-role"
            className="add-member-form__select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="admin">Administrador</option>
            <option value="user">Editor</option>
            <option value="viewer">Lector</option>
          </select>
        </div>

        <div className="add-member-form__actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Enviar Invitación
          </Button>
        </div>
      </form>
    </Modal>
  );
}
