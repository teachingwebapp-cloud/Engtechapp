import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Video,
  Activity,
  UserPlus,
  PlusCircle,
  ListOrdered,
  LogOut,
  ShieldCheck,
  ChevronRight,
  X,
  Lock
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.875rem',
      padding: '0.875rem 1.25rem',
      borderRadius: '0.875rem',
      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
      backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
      fontWeight: isActive ? '700' : '500',
      textDecoration: 'none',
      marginBottom: '0.5rem',
      transition: 'var(--transition-fast)',
      borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
      fontSize: '0.95rem',
      letterSpacing: '0.1px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '44px' /* touch target */
    })}
  >
    {({ isActive }) => (
      <>
        <div style={{ 
          fontSize: '1.25rem', 
          display: 'flex', 
          alignItems: 'center',
          color: isActive ? 'var(--primary)' : 'var(--text-light)'
        }}>
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span style={{ flex: 1 }}>{label}</span>
        {isActive && (
          <motion.div
            layoutId="active-indicator"
            style={{ color: 'var(--primary)', opacity: 0.7 }}
          >
            <ChevronRight size={16} />
          </motion.div>
        )}
      </>
    )}
  </NavLink>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const getLinks = () => {
    if (user?.role === 'admin') {
      return [
        { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/teacher/create-student', icon: UserPlus, label: 'Add Student' },
        { to: '/teacher/create-class', icon: PlusCircle, label: 'Create Class' },
        { to: '/teacher/enroll-students', icon: Video, label: 'Enroll Students' },
        { to: '/teacher/manage-classes', icon: ListOrdered, label: 'Manage Classes' },
        { to: '/teacher/students', icon: Users, label: 'All Students' },
        { to: '/teacher/credentials', icon: Lock, label: 'Student Credentials' },
        { to: '/teacher/activity-logs', icon: Activity, label: 'Activity Logs' },
        { to: '/change-password', icon: Lock, label: 'Change Password' },
      ];
    }
    if (user?.role === 'student') {
      return [
        { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/student/my-classes', icon: Video, label: 'My Classes' },
        { to: '/student/my-activity', icon: Activity, label: 'My Activity' },
      ];
    }
    return [];
  };

  const handleNavClick = () => {
    // On mobile, close sidebar when a link is clicked
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div style={{ 
        marginBottom: '2.5rem', 
        padding: '0 0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'var(--primary)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            flexShrink: 0
          }}>
            <ShieldCheck size={24} />
          </div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px' }}>
            EngTeach<span style={{ color: 'var(--primary)' }}>.</span>
          </h2>
        </div>
        {/* Close button - visible only on mobile via CSS logic (shows when sidebar is open on mobile) */}
        <button
          onClick={onClose}
          className="mobile-menu-btn"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          color: 'var(--text-light)', 
          textTransform: 'uppercase', 
          letterSpacing: '1px',
          marginBottom: '1rem',
          paddingLeft: '1.25rem'
        }}>
          Menu
        </div>
        {getLinks().map((link) => (
          <SidebarItem key={link.to} {...link} onClick={handleNavClick} />
        ))}
      </nav>

      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '1.5rem', 
        borderTop: '1px solid var(--border-light)' 
      }}>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            padding: '0.875rem 1.25rem',
            borderRadius: '0.875rem',
            color: 'var(--danger)',
            backgroundColor: 'transparent',
            fontWeight: '600',
            border: 'none',
            width: '100%',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            fontSize: '0.95rem',
            minHeight: '44px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
