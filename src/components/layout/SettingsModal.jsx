import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './SettingsModal.css';

/**
 * Settings modal for application configuration.
 * Includes "Ver interfaz como" option for administrators.
 */
export default function SettingsModal({ isOpen, onClose }) {
  const { currentUser, activeRole, setActiveRole } = useAuth();

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';

  const roles = [
    { id: 'admin', label: 'Administrador' },
    { id: 'user', label: 'Usuario' },
    { id: 'viewer', label: 'Lector' },
  ];

  const handleRoleChange = (e) => {
    setActiveRole(e.target.value);
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <header className="settings-modal__header">
          <h2 className="settings-modal__title">Configuración</h2>
          <button className="settings-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="settings-modal__content">
          <section className="settings-modal__section">
            <h3 className="settings-modal__section-title">Previsualización de Interfaz</h3>
            <p className="settings-modal__section-desc">
              Cambia cómo ves la aplicación para probar diferentes permisos de usuario. 
              Esta opción solo está disponible para administradores.
            </p>
            
            <div className="settings-modal__field">
              <label htmlFor="role-select">Ver la interfaz como:</label>
              {isAdmin ? (
                <select 
                  id="role-select" 
                  className="settings-modal__select"
                  value={activeRole}
                  onChange={handleRoleChange}
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.label}</option>
                  ))}
                </select>
              ) : (
                <div className="settings-modal__readonly">
                  Acceso restringido a administradores.
                </div>
              )}
            </div>
          </section>

          <section className="settings-modal__section">
            <h3 className="settings-modal__section-title">General</h3>
            <div className="settings-modal__field settings-modal__field--row">
              <label>Notificaciones de escritorio</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="settings-modal__field settings-modal__field--row">
              <label>Tema oscuro (Próximamente)</label>
              <input type="checkbox" disabled />
            </div>
          </section>
        </div>

        <footer className="settings-modal__footer">
          <button className="settings-modal__btn settings-modal__btn--primary" onClick={onClose}>
            Listo
          </button>
        </footer>
      </div>
    </div>
  );
}
