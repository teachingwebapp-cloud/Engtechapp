import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';

// Resolve backend socket URL
const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');

import { 
  Calendar, 
  Clock, 
  Video, 
  User, 
  BookOpen,
  Trophy,
  ArrowRight,
  PlayCircle
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        setClasses(res.data.classes || []);
      } catch (err) {
        console.error('Failed to fetch student classes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();

    // Listen for real-time enrollment updates
    const socket = io(SOCKET_URL);
    if (user?._id) {
      socket.on(`enrollment_added_${user._id}`, () => fetchClasses());
      socket.on(`enrollment_removed_${user._id}`, () => fetchClasses());
    }

    // Also listen for class live status changes globally
    socket.on('class_live', ({ classId }) => {
      setClasses(prev => prev.map(c => c._id === classId ? { ...c, status: 'live' } : c));
    });
    socket.on('class_ended', ({ classId }) => {
      setClasses(prev => prev.map(c => c._id === classId ? { ...c, status: 'completed' } : c));
    });

    return () => socket.disconnect();
  }, [user?._id]);

  const sortedClasses = [...classes].sort((a,b) => new Date(a.schedule) - new Date(b.schedule));
  const upcoming = sortedClasses.filter(c => c.status !== 'completed');
  const completedCount = sortedClasses.filter(c => c.status === 'completed').length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-faint)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: '1200px', margin: '0 auto' }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0', letterSpacing: '-1px' }}>
          Welcome back, {user?.name.split(' ')[0]}! 🚀
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
          You have {upcoming.length} upcoming sessions. Ready to practice?
        </p>
      </div>

      <motion.div variants={itemVariants} className="stats-grid">
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'var(--primary)', 
          borderRadius: '1.25rem', 
          color: 'white',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '0.75rem' }}>
              <Video size={24} />
            </div>
            <Badge variant="secondary" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>Active</Badge>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{upcoming.length}</div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Classes Scheduled</div>
        </div>

        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'var(--surface)', 
          borderRadius: '1.25rem', 
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '0.75rem' }}>
              <Trophy size={24} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{completedCount}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sessions Completed</div>
        </div>

        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'var(--surface)', 
          borderRadius: '1.25rem', 
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(249, 115, 22, 0.1)', color: 'var(--warning)', borderRadius: '0.75rem' }}>
              <BookOpen size={24} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>Eng-A2</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Current Level</div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Next Sessions
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/my-classes')} icon={<ArrowRight size={16} />}>
            See all classes
          </Button>
        </div>
        
        {upcoming.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem', 
            backgroundColor: 'var(--surface)', 
            borderRadius: '1.5rem',
            border: '2px dashed var(--border-color)'
          }}>
            <div style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
              <Calendar size={48} strokeWidth={1} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No classes scheduled</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
              Your teacher hasn't scheduled any classes for you yet. We'll notify you once a new session is added.
            </p>
          </div>
        ) : (
          <div className="card-grid">
            {upcoming.map((cls) => (
              <motion.div
                key={cls._id}
                whileHover={{ y: -5 }}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '1.5rem',
                  padding: '1.75rem',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {cls.status === 'live' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '1.25rem', 
                    right: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--danger)',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--danger)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
                    LIVE NOW
                  </div>
                )}
                
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem', paddingRight: cls.status === 'live' ? '5rem' : '0' }}>
                  {cls.title}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ color: 'var(--primary)', flexShrink: 0 }}><User size={18} /></div>
                    <span style={{ fontSize: '0.9rem' }}>Teacher: <strong>{cls.teacherId?.name || 'TBA'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ color: 'var(--primary)', flexShrink: 0 }}><Calendar size={18} /></div>
                    <span style={{ fontSize: '0.9rem' }}>{new Date(cls.schedule).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ color: 'var(--primary)', flexShrink: 0 }}><Clock size={18} /></div>
                    <span style={{ fontSize: '0.9rem' }}>{new Date(cls.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <Button 
                  fullWidth 
                  size="lg"
                  variant={cls.status === 'live' ? 'danger' : 'primary'}
                  onClick={() => navigate(`/jitsi/${cls._id}`)}
                  icon={cls.status === 'live' ? <PlayCircle size={20} /> : <Video size={20} />}
                >
                  {cls.status === 'live' ? 'Join Live Class' : 'Enter Classroom'}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.7; }
          100% { transform: scale(0.95); opacity: 1; }
        }
      `}</style>
    </motion.div>
  );
};

export default StudentDashboard;
