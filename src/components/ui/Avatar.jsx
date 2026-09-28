import './Avatar.css';

/**
 * Avatar component displaying a user image or initials fallback.
 * Handles AI agent indicator badge.
 */
export default function Avatar({
  user,
  size = 'md',
  showAiBadge = false,
  className = '',
}) {
  if (!user) return null;

  const sizeClass = `avatar--${size}`;

  return (
    <div
      className={`avatar ${sizeClass} ${className}`}
      title={user.fullName}
      style={{ '--avatar-color': user.color }}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.fullName}
          className="avatar__image"
        />
      ) : (
        <span className="avatar__initials">{user.initials}</span>
      )}
      {showAiBadge && user.isAiAgent && (
        <span className="avatar__ai-badge" aria-label="Agente IA">
          AI
        </span>
      )}
    </div>
  );
}
