import React from 'react';

const Badge = ({ children, variant = 'primary', size = 'md' }) => {
  const styles = {
    primary: { bg: '#eff6ff', color: '#1e40af', border: '1px solid #3b82f6' },
    secondary: { bg: '#f0f9ff', color: '#0369a1', border: '1px solid #06b6d4' },
    success: { bg: '#ecfdf5', color: '#059669', border: '1px solid #10b981' },
    warning: { bg: '#fefce8', color: '#b45309', border: '1px solid #f97316' },
    danger: { bg: '#fef2f2', color: '#be123c', border: '1px solid #ef4444' },
    gray: { bg: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }
  };

  const sizes = {
    sm: { padding: '0.25rem 0.625rem', fontSize: '0.75rem' },
    md: { padding: '0.375rem 0.875rem', fontSize: '0.85rem' },
    lg: { padding: '0.5rem 1rem', fontSize: '0.95rem' }
  };

  const selected = styles[variant] || styles.gray;
  const selectedSize = sizes[size] || sizes.md;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      ...selectedSize,
      borderRadius: '0.75rem',
      fontWeight: '600',
      backgroundColor: selected.bg,
      color: selected.color,
      border: selected.border,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
      transition: 'var(--transition-fast)'
    }}>
      {children}
    </span>
  );
};

export default Badge;
