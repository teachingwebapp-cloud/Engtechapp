import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto redirect if already logged in
  if (user) {
    if (user.mustChangePassword && user.role === 'admin') return <Navigate to="/change-password" />;
    if (user.role === 'admin') return <Navigate to="/teacher/dashboard" />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" />;
    // If user exists but role is not teacher/student, don't just loop to /login
    // This handles edge cases and prevents redirect loops
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await login(studentId, password);
      
      if (result.success) {
        const u = result.user;
        if (u.mustChangePassword && u.role === 'admin') navigate('/change-password');
        else if (u.role === 'admin') navigate('/teacher/dashboard');
        else if (u.role === 'student') navigate('/student/dashboard');
      }
    } catch (err) {
      console.error('Login handleSubmit error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '400px', width: '100%', padding: 'clamp(1.5rem, 5vw, 2.5rem)',
        backgroundColor: 'var(--surface)', borderRadius: '1rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>
            EngTeach<span style={{ color: 'var(--accent-hover)' }}>.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Secure Spoken English System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
              Student ID or Username
            </label>
            <input 
              type="text" 
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. ENG-2026-001"
              required 
            />
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.35 }}>
              Password must be at least 6 characters and include both letters and numbers.
            </div>
          </div>
          
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
