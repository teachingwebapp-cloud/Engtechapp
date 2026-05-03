import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

// Resolve backend socket URL (same pattern as ClassroomChat)
const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');

const MyClasses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        const sorted = res.data.classes.sort((a, b) => new Date(a.schedule) - new Date(b.schedule));
        setClasses(sorted);
      } catch (err) {
        toast.error('Failed to load classes');
      } finally { setLoading(false); }
    };

    fetchClasses();

    // Fix #9: Replace 3s setInterval polling with Socket.IO real-time updates.
    // Server emits 'class_live' when teacher starts a class and 'class_ended' when they end it.
    const socket = io(SOCKET_URL);

    // Listen to personal enrollment updates
    if (user?._id) {
      socket.on(`enrollment_added_${user._id}`, () => fetchClasses());
      socket.on(`enrollment_removed_${user._id}`, () => fetchClasses());
    }

    socket.on('class_live', ({ classId, title, teacherName }) => {
      setClasses(prev => {
        const updated = prev.map(c =>
          c._id === classId ? { ...c, status: 'live' } : c
        );
        // Only show toast if this class is in the student's list
        if (updated.some(c => c._id === classId && c.status === 'live')) {
          toast.success(`🔴 "${title}" is now live! Join now.`, { duration: 6000 });
        }
        return updated;
      });
    });

    socket.on('class_ended', ({ classId }) => {
      setClasses(prev => prev.map(c =>
        c._id === classId ? { ...c, status: 'completed' } : c
      ));
    });

    return () => socket.disconnect();
  }, [user?._id]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const liveClasses = classes.filter(c => c.status === 'live');
  const otherClasses = classes.filter(c => c.status !== 'live');

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>My Classes</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Your learning schedule — you'll be notified instantly when a class goes live.</p>
      </div>

      {liveClasses.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'rgb(239, 68, 68)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', animation: 'pulse 2s infinite' }}>🔴</span> Live Now!
          </h2>
          <div className="live-cards-grid">
            {liveClasses.map(cls => (
              <Card key={cls._id} style={{ borderLeft: '4px solid rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{cls.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <Badge variant="danger" style={{ fontSize: '0.85rem', fontWeight: 700 }}>🔴 LIVE</Badge>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(cls.schedule).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Instructor: <strong>{cls.teacherId?.name}</strong></div>
                </div>
                <Button onClick={() => navigate(`/jitsi/${cls._id}`)} fullWidth
                  style={{ backgroundColor: 'rgb(239, 68, 68)', color: 'white', fontWeight: 700, fontSize: '1rem', padding: '0.75rem' }}
                >🎥 Join Now!</Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {otherClasses.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            {liveClasses.length > 0 ? 'Upcoming Classes' : 'Your Classes'}
          </h2>
          <Card>
            <Table
              headers={['Topic', 'Instructor', 'Date & Time', 'Status', 'Action']}
              data={otherClasses}
              emptyMessage="No more classes scheduled."
          renderRow={(cls) => (
                <>
                  <td data-label="Topic" style={{ padding: '1rem', fontWeight: 500 }}>{cls.title}</td>
                  <td data-label="Instructor" style={{ padding: '1rem', color: 'var(--text-muted)' }}>{cls.teacherId?.name || 'TBA'}</td>
                  <td data-label="Date & Time" style={{ padding: '1rem' }}>{new Date(cls.schedule).toLocaleString()}</td>
                  <td data-label="Status" style={{ padding: '1rem' }}>
                    <Badge variant={cls.status === 'scheduled' ? 'primary' : 'gray'}>
                      {cls.status === 'scheduled' ? '📅 Scheduled' : '✓ Completed'}
                    </Badge>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <Button size="sm" variant="primary" disabled={true} title="Class is not live yet">Waiting...</Button>
                  </td>
                </>
              )}
            />
          </Card>
        </div>
      )}

      {classes.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>📭 No classes yet</p>
            <p>Your teacher will enroll you in classes soon!</p>
          </div>
        </Card>
      )}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
};

export default MyClasses;
