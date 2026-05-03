import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  title = ''
}) => {
  const isDisabled = disabled || loading;
  
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: '0.75rem',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'var(--transition-fast)',
    border: 'none',
    outline: 'none',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    letterSpacing: '0.3px',
  };

  const sizes = {
    sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    md: { padding: '0.75rem 1.5rem', fontSize: '0.95rem' },
    lg: { padding: '1rem 2rem', fontSize: '1.05rem' }
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-md)',
      ':hover': { backgroundColor: 'var(--primary-dark)', boxShadow: 'var(--shadow-lg)', transform: 'translateY(-1px)' }
    },
    secondary: {
      backgroundColor: 'var(--surface-secondary)',
      color: 'var(--text-main)',
      border: '1.5px solid var(--border-color)',
      ':hover': { backgroundColor: 'var(--border-light)', borderColor: 'var(--primary)' }
    },
    success: {
      backgroundColor: 'var(--success)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-md)',
      ':hover': { backgroundColor: 'var(--success)', opacity: 0.9, boxShadow: 'var(--shadow-lg)' }
    },
    danger: {
      backgroundColor: 'var(--danger)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-md)',
      ':hover': { backgroundColor: '#dc2626', boxShadow: 'var(--shadow-lg)', transform: 'translateY(-1px)' }
    },
    warning: {
      backgroundColor: 'var(--warning)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-md)',
      ':hover': { backgroundColor: '#ea580c', boxShadow: 'var(--shadow-lg)' }
    },
    outline: {
      backgroundColor: 'transparent',
      border: '2px solid var(--primary)',
      color: 'var(--primary)',
      ':hover': { backgroundColor: 'var(--primary-faint)', borderColor: 'var(--primary-dark)' }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-muted)',
      ':hover': { backgroundColor: 'var(--surface-secondary)', color: 'var(--text-main)' }
    }
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const currentStyles = {
    ...baseStyles,
    ...sizes[size],
    ...variants[variant],
    ...(isHovered && !isDisabled && variants[variant][':hover'] ? variants[variant][':hover'] : {})
  };

  return (
    <button
      type={type}
      style={currentStyles}
      onClick={onClick}
      disabled={isDisabled}
      className={className}
      title={title}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {loading && (
        <span style={{
          width: '1.2em',
          height: '1.2em',
          border: '2px solid',
          borderColor: 'currentColor transparent currentColor transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          display: 'inline-block'
        }} />
      )}
      {icon && !loading && <span style={{ fontSize: '1.1em' }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default Button;
