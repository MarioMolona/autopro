import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

/**
 * Login page with email/password form and Google OAuth button.
 * Uses mock auth — any valid email from mock data logs in.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);
    if (!success) {
      setError('Credenciales incorrectas o usuario no registrado');
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = () => {
    alert('El inicio de sesión con Google no está configurado. Usa tu correo y contraseña.');
  };

  return (
    <div className="login-page">
      <div className="login-page__bg-shapes">
        <div className="login-page__shape login-page__shape--1" />
        <div className="login-page__shape login-page__shape--2" />
        <div className="login-page__shape login-page__shape--3" />
      </div>

      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__logo">
            <span className="login-card__logo-icon">CF</span>
          </div>
          <h1 className="login-card__title">ContentFlow Pro</h1>
          <p className="login-card__subtitle">
            Gestión Kanban para preproducción de contenido en video
          </p>
        </div>

        <form className="login-card__form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-card__error" role="alert">
              {error}
            </div>
          )}

          <div className="login-card__field">
            <label className="login-card__label" htmlFor="login-email">
              Correo electrónico
            </label>
            <div className="login-card__input-wrapper">
              <Mail size={18} className="login-card__input-icon" />
              <input
                id="login-email"
                type="email"
                className="login-card__input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-card__field">
            <label className="login-card__label" htmlFor="login-password">
              Contraseña
            </label>
            <div className="login-card__input-wrapper">
              <Lock size={18} className="login-card__input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="login-card__input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-card__toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-card__submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="login-card__spinner" />
            ) : (
              'Iniciar Sesión'
            )}
          </button>

          <div className="login-card__divider">
            <span>o continúa con</span>
          </div>

          <button
            type="button"
            className="login-card__google-btn"
            onClick={handleGoogleLogin}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            <span>Continuar con Google</span>
          </button>
        </form>

      </div>
    </div>
  );
}
