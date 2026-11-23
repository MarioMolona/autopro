import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { checkPushSubscription, subscribeToPush, testPushNotification } from '../../utils/push';
import './SettingsModal.css';

/**
 * Settings modal for application configuration.
 * Includes "Ver interfaz como" option for administrators.
 */
export default function SettingsModal({ isOpen, onClose }) {
  const { currentUser, activeRole, setActiveRole } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkPushSubscription().then(setIsSubscribed).catch(console.error);
    }
  }, [isOpen]);

  const handleSubscribe = async () => {
    setLoadingPush(true);
    try {
      await subscribeToPush(currentUser.id);
      setIsSubscribed(true);
    } catch (err) {
      alert(err.message || 'Error al suscribirse a notificaciones.');
    } finally {
      setLoadingPush(false);
    }
  };

  const handleTestPush = async () => {
    setLoadingPush(true);
    try {
      await testPushNotification(currentUser.id);
    } catch (err) {
      alert('Error al enviar notificación de prueba.');
    } finally {
      setLoadingPush(false);
    }
  };

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
            <h3 className="settings-modal__section-title">Notificaciones Push</h3>
            <p className="settings-modal__section-desc" style={{marginBottom: '1rem'}}>
              Recibe notificaciones en este dispositivo, incluso con la app cerrada.
            </p>
            <div className="settings-modal__field settings-modal__field--row">
              <label>Notificaciones Push nativas</label>
              {isSubscribed ? (
                <span style={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>Activadas ✓</span>
              ) : (
                <button 
                  className="settings-modal__btn settings-modal__btn--primary" 
                  onClick={handleSubscribe} 
                  disabled={loadingPush}
                >
                  {loadingPush ? 'Activando...' : 'Activar'}
                </button>
              )}
            </div>
            
            {isSubscribed && (
              <div className="settings-modal__field" style={{marginTop: '1rem'}}>
                <button 
                  className="settings-modal__btn" 
                  onClick={handleTestPush}
                  disabled={loadingPush}
                >
                  Probar notificación
                </button>
              </div>
            )}
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
