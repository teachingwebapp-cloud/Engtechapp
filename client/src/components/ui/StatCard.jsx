import React from 'react';
import Card from './Card';

const StatCard = ({ title, value, icon, trend, color = 'primary' }) => {
  const colorMap = {
    primary: { bg: '#eff6ff', text: '#1e40af', icon: '#3b82f6' },
    success: { bg: '#ecfdf5', text: '#059669', icon: '#10b981' },
    warning: { bg: '#fefce8', text: '#b45309', icon: '#f97316' },
    danger: { bg: '#fef2f2', text: '#be123c', icon: '#ef4444' },
    secondary: { bg: '#f0f9ff', text: '#0369a1', icon: '#06b6d4' }
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <Card variant="default">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="stat-card-title" style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: 'var(--text-muted)',
            margin: '0 0 0.5rem 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </p>
          <h3 className="stat-card-value" style={{
            fontSize: '2rem',
            fontWeight: '800',
            margin: '0 0 0.5rem 0',
            color: colors.text,
            letterSpacing: '-1px'
          }}>
            {value}
          </h3>
          {trend && (
            <div style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              color: trend.positive ? 'var(--success)' : 'var(--danger)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <span style={{ fontSize: '1em' }}>
                {trend.positive ? '📈' : '📉'}
              </span>
              {trend.label}
            </div>
          )}
        </div>
        {icon && (
          <div className="stat-card-icon" style={{
            padding: '0.75rem',
            backgroundColor: colors.bg,
            borderRadius: '0.875rem',
            color: colors.icon,
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3.25rem',
            height: '3.25rem',
            border: `2px solid ${colors.text}20`,
            flexShrink: 0
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
