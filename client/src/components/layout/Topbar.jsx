import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';
import {
  LogOut,
  User,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Key,
  Menu,
  Moon,
  Sun
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const Topbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="topbar">
      {/* Hamburger - visible on mobile only via CSS */}
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
        <Menu size={22} />
      </button>

      {/* Search - hidden on mobile via CSS */}
      <div className="topbar-search">
        <Search 
          size={18} 
          style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: 'var(--text-light)' 
          }} 
        />
        <input 
          type="text" 
          placeholder="Search classes, students..." 
          style={{
            width: '100%',
            padding: '0.625rem 1rem 0.625rem 2.5rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'var(--transition-fast)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.backgroundColor = 'var(--surface)';
            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.backgroundColor = 'var(--bg-secondary)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <div className="topbar-actions">
        <button 
          onClick={toggleTheme}
          style={{
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            minWidth: '36px',
            minHeight: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button style={{
          padding: '0.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'var(--transition-fast)',
          minWidth: '36px',
          minHeight: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Bell size={20} />
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '8px',
            height: '8px',
            backgroundColor: 'var(--danger)',
            borderRadius: '50%',
            border: '2px solid var(--surface)'
          }}></span>
        </button>

        <div style={{ width: '1px', height: '1.5rem', backgroundColor: 'var(--border-color)' }}></div>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.375rem',
              paddingRight: '0.75rem',
              borderRadius: '9999px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--surface)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              minHeight: '40px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => !showProfileMenu && (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.875rem',
              flexShrink: 0
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <ChevronDown size={14} style={{ 
              color: 'var(--text-light)',
              transform: showProfileMenu ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease'
            }} />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                  onClick={() => setShowProfileMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    right: 0,
                    width: '220px',
                    backgroundColor: 'var(--surface)',
                    borderRadius: '1rem',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem',
                    zIndex: 50
                  }}
                >
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-light)' }}>{user?.studentId}</p>
                  </div>
                  
                  {user?.role === 'admin' && (
                    <Link 
                      to="/change-password" 
                      onClick={() => setShowProfileMenu(false)}
                      className="menu-item-hover"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 0.75rem',
                        borderRadius: '0.5rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      <Key size={16} />
                      Change Password
                    </Link>
                  )}

                  <button 
                    onClick={logout}
                    className="menu-item-hover-danger"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.5rem',
                      color: 'var(--danger)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                      marginTop: '0.25rem'
                    }}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
