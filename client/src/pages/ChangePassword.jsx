import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import { FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password updated successfully. Please login again.');
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center page-container" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', padding: '1rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel" 
        style={{
          maxWidth: '450px', width: '100%', padding: '2.5rem',
          backgroundColor: 'var(--surface)', borderRadius: '1.25rem',
          boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '64px', height: '64px', backgroundColor: 'rgba(37, 99, 235, 0.1)', 
            borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', color: 'var(--primary)'
          }}>
            <FiLock size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Secure Your Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {user?.mustChangePassword 
              ? "Your administrator requires you to change your temporary password before continuing."
              : "Please enter your current and new password below."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.625rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                style={{ width: '100%', paddingLeft: '1rem' }}
                required 
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.625rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              New Password
            </label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters, letters & numbers"
              style={{ width: '100%', paddingLeft: '1rem' }}
              required 
            />
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.625rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Confirm New Password
            </label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              style={{ width: '100%', paddingLeft: '1rem' }}
              required 
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            {!user?.mustChangePassword && (
              <Button type="button" variant="secondary" fullWidth onClick={() => navigate(-1)} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem', display: 'flex', gap: '0.75rem' }}>
          <FiAlertCircle style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.125rem' }} />
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            For security, you will be automatically logged out after changing your password.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ChangePassword;
