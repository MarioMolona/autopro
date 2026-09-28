import './Badge.css';

/**
 * Badge component for labels, priorities, and status tags.
 * Color is passed as a prop; text is the children.
 */
export default function Badge({ children, color, variant = 'filled', className = '' }) {
  return (
    <span
      className={`badge badge--${variant} ${className}`}
      style={{ '--badge-color': color }}
    >
      {children}
    </span>
  );
}
