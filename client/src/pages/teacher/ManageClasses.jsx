import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

// Resolve backend socket URL (same pattern as ClassroomChat)
const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');

const ManageClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.classes || []);
    } catch (_err) {
      toast.error(_err?.response?.data?.message || 'Failed to load classes');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchClasses();

    // Fix #1 & #10: Replace setInterval polling with Socket.IO real-time events.
    // The server emits 'class_live' and 'class_ended' when status changes.
    const socket = io(SOCKET_URL);

    socket.on('class_live', ({ classId, title }) => {
      setClasses(prev => prev.map(c =>
        c._id === classId ? { ...c, status: 'live' } : c
      ));
      toast.success(`🔴 "${title}" is now live!`);
    });

    socket.on('class_ended', ({ classId, title }) => {
      setClasses(prev => prev.map(c =>
        c._id === classId ? { ...c, status: 'completed' } : c
      ));
    });

    return () => socket.disconnect();
  }, []);

  const openEnrollModal = async (cls) => {
    setSelectedClass(cls);
    setIsEnrollModalOpen(true);
    setEnrollLoading(true);
    try {
      const [enrollRes, studentsRes] = await Promise.all([
        api.get(`/enrollments/${cls._id}`),
        api.get('/users?role=student&status=active')
      ]);
      setEnrollments(enrollRes.data.enrollments || []);
      setAllStudents(studentsRes.data.users || []);
    } catch (_e) {
      toast.error(_e?.response?.data?.message || 'Failed to load enrollment data');
    } finally { setEnrollLoading(false); }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    try {
      await api.post('/enrollments', { classId: selectedClass._id, studentIds: [selectedStudentId] });
      toast.success('Student enrolled securely');
      setSelectedStudentId('');
      const res = await api.get(`/enrollments/${selectedClass._id}`);
      setEnrollments(res.data.enrollments);
    } catch (err) { toast.error(err.response?.data?.message || 'Enrollment failed'); }
  };

  const handleRemoveEnrollment = async (enrollmentId) => {
    try {
      await api.delete(`/enrollments/${enrollmentId}`);
      toast.success('Student removed from class');
      setEnrollments(enrollments.filter(e => e._id !== enrollmentId));
    } catch (_err) { toast.error(_err?.response?.data?.message || 'Failed to remove student'); }
  };

  const handleUpdateStatus = async (classId, newStatus) => {
    try {
      await api.patch(`/classes/${classId}`, { status: newStatus });
      toast.success(`Class marked as ${newStatus}`);
      // Optimistically update local state; socket event will also arrive and confirm
      setClasses(prev => prev.map(c => c._id === classId ? { ...c, status: newStatus } : c));
    } catch (_err) { toast.error(_err?.response?.data?.message || 'Failed to update class state'); }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading classes...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Manage Classes</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>View, edit, and start live sessions. Updates are real-time.</p>
      </div>

      {classes.some(c => c.status === 'live') && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgb(239, 68, 68)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '1.5rem', animation: 'pulse 2s infinite', flexShrink: 0 }}>🔴</div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ color: 'rgb(239, 68, 68)' }}>Live Classes Active!</strong>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              {classes.filter(c => c.status === 'live').map(c => c.title).join(', ')} is/are currently live.
            </p>
          </div>
        </div>
      )}

      <Card>
        <Table
          headers={['Title', 'Schedule', 'Status', 'Duration', 'Actions']}
          data={classes}
          emptyMessage="You haven't created any classes yet."
          renderRow={(cls) => (
            <>
              <td data-label="Title" style={{ padding: '1rem', fontWeight: 500 }}>{cls.title}</td>
              <td data-label="Schedule" style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(cls.schedule).toLocaleString()}</td>
              <td data-label="Status" style={{ padding: '1rem' }}>
                <Badge variant={cls.status === 'live' ? 'danger' : (cls.status === 'scheduled' ? 'primary' : 'gray')}>
                  {cls.status === 'live' ? '🔴 LIVE' : cls.status}
                </Badge>
              </td>
              <td data-label="Duration" style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {cls.duration ? `${cls.duration} min` : '60 min'}
              </td>
              <td style={{ padding: '1rem' }}>
                <div className="table-action-group">
                {cls.status === 'live' ? (
                  <>
                    <Button size="sm" style={{ backgroundColor: 'rgb(239, 68, 68)', color: 'white', fontWeight: 600 }}
                      onClick={() => handleUpdateStatus(cls._id, 'completed')}>🛑 End</Button>
                    <Button size="sm" style={{ backgroundColor: 'rgb(34, 197, 94)', color: 'white' }}
                      onClick={() => navigate(`/jitsi/${cls._id}`)}>📹 Join</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" style={{ backgroundColor: 'rgb(34, 197, 94)', color: 'white', fontWeight: 600 }}
                      onClick={() => handleUpdateStatus(cls._id, 'live')}>▶ Live</Button>
                    <Button size="sm" variant="secondary" onClick={() => openEnrollModal(cls)}>📋 Students</Button>
                  </>
                )}
                </div>
              </td>
            </>
          )}
        />
      </Card>

      <Modal isOpen={isEnrollModalOpen} onClose={() => setIsEnrollModalOpen(false)} title={`Manage: ${selectedClass?.title}`} size="lg">
        {enrollLoading ? (<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>) : (
          <div>
            <form onSubmit={handleEnrollStudent} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}
                style={{ flex: 1, minWidth: '200px' }} required>
                <option value="" disabled>🔍 Select a student to add...</option>
                {allStudents
                  .filter(st => !enrollments.some(e => e.studentId._id === st._id))
                  .map(st => (<option key={st._id} value={st._id}>{st.name} ({st.studentId})</option>))}
              </select>
              <Button type="submit" style={{ whiteSpace: 'nowrap' }}>Add Student</Button>
            </form>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 1rem 0' }}>
                Enrolled Students ({enrollments.length})
              </h4>

              {enrollments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 1rem' }}>No students enrolled yet. Add one above.</p>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {enrollments.map(e => (
                    <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.375rem', marginBottom: '0.5rem', border: '1px solid var(--border-color)', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500, display: 'block' }}>{e.studentId?.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{e.studentId?.studentId}</span>
                      </div>
                      <Button size="sm" variant="ghost" style={{ color: 'var(--danger)', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
                        onClick={() => handleRemoveEnrollment(e._id)}>✕ Remove</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
};

export default ManageClasses;
