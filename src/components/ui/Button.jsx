import './Button.css';

/**
 * Reusable button component with multiple variants.
 * Supports icon-only mode and loading state.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconOnly = false,
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    iconOnly && 'btn--icon-only',
    loading && 'btn--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {Icon && <Icon className="btn__icon" size={iconOnly ? 18 : 16} />}
      {!iconOnly && <span className="btn__label">{children}</span>}
    </button>
  );
}
