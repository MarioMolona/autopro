import { useAuth } from '../../context/AuthContext';
import { useBoard } from '../../context/BoardContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import './DashboardOverview.css';

/**
 * Dashboard Overview component with project stats and recent activity.
 * Designed to provide a high-level summary of the project state.
 */
export default function DashboardOverview() {
  const { allUsers, notifications } = useAuth();
  const { columns, cards } = useBoard();

  // Simple stats calculation
  const totalTasks = cards.length;
  const inProgressTasks = cards.filter(c => c.columnId !== 'col-001' && c.columnId !== 'col-010').length;
  const completedTasks = cards.filter(c => c.columnId === 'col-010').length;
  const urgentTasks = cards.filter(c => c.priority === 'urgent' || c.priority === 'high').length;

  const stats = [
    { label: 'Tareas Totales', value: totalTasks, icon: CheckCircle2, color: 'var(--color-primary-500)' },
    { label: 'En Progreso', value: inProgressTasks, icon: Clock, color: 'var(--color-warning)' },
    { label: 'Completadas', value: completedTasks, icon: TrendingUp, color: 'var(--color-success)' },
    { label: 'Urgentes', value: urgentTasks, icon: AlertCircle, color: 'var(--color-danger)' },
  ];

  return (
    <div className="dashboard-overview">
      <header className="dashboard-overview__header">
        <h1 className="dashboard-overview__title">Resumen del Proyecto</h1>
        <p className="dashboard-overview__subtitle">Aquí tienes un vistazo rápido de lo que está sucediendo hoy.</p>
      </header>

      <div className="dashboard-overview__stats">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card__icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{stat.value}</span>
              <span className="stat-card__label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-overview__content">
        <section className="dashboard-section dashboard-section--activity">
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">Actividad Reciente</h2>
            <button className="dashboard-section__link">Ver Todo</button>
          </div>
          <div className="activity-feed">
            {notifications.slice(0, 5).map((notif, i) => (
              <div key={i} className="activity-item">
                <div className="activity-item__avatar">
                  <div className="activity-item__dot" style={{ backgroundColor: i % 2 === 0 ? 'var(--color-primary-500)' : 'var(--color-success)' }} />
                </div>
                <div className="activity-item__text">
                  <p className="activity-item__message">{notif.message}</p>
                  <span className="activity-item__time">Hace {i + 1} horas</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section dashboard-section--team">
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">Equipo en Línea</h2>
            <button className="dashboard-section__link">Gestionar</button>
          </div>
          <div className="team-status-list">
            {allUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="team-status-item">
                <div className="team-status-item__info">
                  <span className="team-status-item__name">{user.fullName}</span>
                  <span className="team-status-item__role">{user.isAiAgent ? 'AI Agent' : user.role}</span>
                </div>
                <div className={`status-indicator status-indicator--${user.isActive ? 'online' : 'offline'}`} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="dashboard-section dashboard-section--ai-summary">
        <div className="dashboard-section__header">
          <div className="dashboard-section__title-group">
            <Sparkles size={20} className="ai-summary__icon" />
            <h2 className="dashboard-section__title">Resumen del Proyecto (IA)</h2>
          </div>
          <span className="ai-summary__badge">Beta</span>
        </div>
        <div className="ai-summary__content">
          <div className="ai-summary__placeholder">
            <p>Generando resumen inteligente del estado de tus proyectos...</p>
            <div className="ai-summary__shimmer" />
          </div>
        </div>
      </section>
    </div>
  );
}
