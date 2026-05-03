import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { toast } from 'react-hot-toast';

const EnrollStudents = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users?role=student&status=active&limit=1000')
      ]);
      setClasses(classesRes.data.classes || []);
      setStudents(studentsRes.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load data');
    } finally { setLoading(false); }
  };

  const handleClassSelect = async (cls) => {
    setSelectedClass(cls);
    setSelectedStudents([]);
    setEnrolledStudents([]);
    try {
      const res = await api.get(`/enrollments/${cls._id}`);
      const enrolledIds = res.data.enrollments.map(e => e.studentId._id);
      setEnrolledStudents(enrolledIds);
    } catch (err) { console.error('Failed to fetch enrollments:', err); }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  const handleEnroll = async () => {
    if (!selectedClass || selectedStudents.length === 0) { toast.error('Select a class and at least one student'); return; }
    setEnrolling(true);
    try {
      await api.post('/enrollments', { classId: selectedClass._id, studentIds: selectedStudents });
      toast.success(`${selectedStudents.length} student(s) enrolled successfully!`);
      setSelectedStudents([]);
      handleClassSelect(selectedClass);
    } catch (err) { toast.error(err.response?.data?.message || 'Enrollment failed'); }
    finally { setEnrolling(false); }
  };

  const availableStudents = students.filter(s => !enrolledStudents.includes(s._id));
  const enrolledCount = enrolledStudents.length;
  const selectedCount = selectedStudents.length;

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Enroll Students to Classes</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Select a class, choose students, and enroll them in bulk.</p>
      </div>

      <div className="responsive-grid-1-2" style={{ marginBottom: '2rem' }}>
        {/* Classes List */}
        <Card>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', margin: '0 0 1rem 0' }}>📚 Classes</h3>
          {classes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No classes created yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto' }}>
              {classes.map(cls => (
                <div key={cls._id} onClick={() => handleClassSelect(cls)}
                  style={{
                    padding: '1rem', backgroundColor: selectedClass?._id === cls._id ? 'var(--primary)' : 'var(--bg-color)',
                    color: selectedClass?._id === cls._id ? 'white' : 'var(--text-main)',
                    borderRadius: '0.5rem', border: `1px solid ${selectedClass?._id === cls._id ? 'var(--primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{cls.title}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>📅 {new Date(cls.schedule).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>✓ {selectedClass?._id === cls._id ? enrolledCount : '—'} enrolled</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Students Selection */}
        <Card>
          {!selectedClass ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1rem' }}>👆 Select a class to start enrolling students</p>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem 0' }}>
                👥 Available Students
                <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  ({selectedCount} selected of {availableStudents.length})
                </span>
              </h3>

              {availableStudents.length === 0 ? (
                <div style={{ backgroundColor: 'var(--bg-color)', padding: '2rem', borderRadius: '0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {enrolledCount === 0 ? (
                    <p>No students available. <a href="/teacher/create-student" style={{ color: 'var(--primary)' }}>Create students first</a></p>
                  ) : (
                    <p>All students are already enrolled in this class! 🎉</p>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {availableStudents.map(student => (
                      <label key={student._id}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-color)',
                          borderRadius: '0.375rem', border: selectedStudents.includes(student._id) ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          cursor: 'pointer', transition: 'all 0.2s', minHeight: '44px'
                        }}
                      >
                        <input type="checkbox" checked={selectedStudents.includes(student._id)}
                          onChange={() => toggleStudentSelection(student._id)}
                          style={{ marginRight: '0.75rem', cursor: 'pointer', width: '18px', height: '18px', flexShrink: 0 }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500 }}>{student.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.studentId}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button onClick={() => setSelectedStudents(availableStudents.map(s => s._id))} variant="outline" fullWidth size="sm">Select All</Button>
                    <Button onClick={() => setSelectedStudents([])} variant="outline" fullWidth size="sm">Clear</Button>
                  </div>

                  <Button onClick={handleEnroll} loading={enrolling} fullWidth disabled={selectedCount === 0} style={{ marginTop: '1rem' }}>
                    {enrolling ? 'Enrolling...' : `✓ Enroll ${selectedCount} Student${selectedCount !== 1 ? 's' : ''}`}
                  </Button>
                </>
              )}

              {enrolledCount > 0 && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.75rem 0' }}>Already Enrolled ({enrolledCount})</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {students.filter(s => enrolledStudents.includes(s._id)).map(s => (
                      <Badge key={s._id} variant="success">{s.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EnrollStudents;
