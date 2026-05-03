import React from 'react';

const Card = ({ children, className = '', title, action, variant = 'default', style = {} }) => {
  const bgColors = {
    default: 'var(--surface)',
    primary: 'var(--primary-faint)',
    success: 'var(--success-light)',
    warning: 'var(--warning-light)',
    danger: 'var(--danger-light)',
    muted: 'var(--surface-secondary)'
  };

  return (
    <div
      className={`card animate-fade-in ${className}`}
      style={{
        backgroundColor: bgColors[variant] || bgColors.default,
        boxShadow: variant === 'default' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        ...style
      }}
    >
      {(title || action) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '1rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {title && (
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
};

export default Card;
