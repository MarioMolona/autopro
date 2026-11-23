import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

/** Se muestra al abrir el enlace de "restablecer contraseña" del correo. */
export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setIsLoading(true);
    const err = await updatePassword(password);
    if (err) setError('No se pudo cambiar la contraseña: ' + err);
    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <h1 className="login-card__title">Nueva contraseña</h1>
          <p className="login-card__subtitle">Escribe tu nueva contraseña</p>
        </div>
        <form className="login-card__form" onSubmit={handleSubmit}>
          {error && <div className="login-card__error" role="alert">{error}</div>}
          <div className="login-card__field">
            <label className="login-card__label" htmlFor="new-password">Nueva contraseña</label>
            <div className="login-card__input-wrapper">
              <Lock size={18} className="login-card__input-icon" />
              <input id="new-password" type="password" className="login-card__input"
                value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>
          </div>
          <div className="login-card__field">
            <label className="login-card__label" htmlFor="confirm-password">Repite la contraseña</label>
            <div className="login-card__input-wrapper">
              <Lock size={18} className="login-card__input-icon" />
              <input id="confirm-password" type="password" className="login-card__input"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
            </div>
          </div>
          <button type="submit" className="login-card__submit" disabled={isLoading}>
            {isLoading ? <span className="login-card__spinner" /> : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
