import { AuthProvider, useAuth } from './context/AuthContext';
import { BoardProvider } from './context/BoardContext';
import { ViewProvider } from './context/ViewContext';
import BoardPage from './pages/BoardPage';
import LoginPage from './pages/LoginPage';
import './styles/global.css';

/**
 * Main App component with Auth-gated routing.
 * The entire app state is managed through contexts.
 */
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <ViewProvider>
      <BoardProvider>
        <BoardPage />
      </BoardProvider>
    </ViewProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
