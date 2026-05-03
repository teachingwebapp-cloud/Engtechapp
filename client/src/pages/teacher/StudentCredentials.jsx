import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Search, Copy, Eye, EyeOff, Download, Trash2 } from 'lucide-react';

const StudentCredentials = () => {
  const { user: currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=student&includePasswords=true');
      setStudents(res.data.users || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load student credentials');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (studentId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleDeleteStudent = async (id, name) => {
    if (window.confirm(`⚠️ Are you sure you want to PERMANENTLY DELETE the student "${name}"?\n\nThis cannot be undone.`)) {
      try {
        await api.delete(`/users/${id}`);
        toast.success(`Student ${name} permanently deleted.`);
        fetchStudents();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleDownloadCSV = () => {
    if (students.length === 0) return toast.error('No students to download');
    const headers = ['Student Name', 'Student ID', 'Password', 'Phone'];
    const csvContent = [
      headers.join(','),
      ...students.map(student => [
        student.name || 'Unknown',
        student.studentId,
        student.plainTextPassword || 'N/A',
        student.phone || 'N/A'
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `student_credentials_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Credentials exported successfully');
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>
            Student Credentials Manager
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
            View and manage all student login credentials securely.
          </p>
        </div>
        <div className="page-header-actions">
          <Button variant="outline" onClick={handleDownloadCSV} icon={<Download size={18} />} disabled={students.length === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            placeholder="Search by name or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>
      </Card>

      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '1.25rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-faint)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading student credentials...</p>
          </div>
        ) : (
          <Table
            headers={['Student Name', 'Student ID', 'Password', 'Phone', 'Actions']}
            data={filteredStudents}
            emptyMessage="No students found matching your search."
            renderRow={(student) => (
              <>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                      {student.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {student.name || 'Unknown'}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                    {student.studentId}
                  </div>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', color: visiblePasswords[student._id] ? 'var(--danger)' : 'var(--text-light)' }}>
                      {visiblePasswords[student._id] ? student.plainTextPassword || 'N/A' : '••••••••'}
                    </div>
                    <button
                      onClick={() => togglePasswordVisibility(student._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }}
                      title={visiblePasswords[student._id] ? 'Hide' : 'Show'}
                    >
                      {visiblePasswords[student._id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  {student.phone || 'N/A'}
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => copyToClipboard(student.studentId, 'Student ID')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      title="Copy ID"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => copyToClipboard(student.plainTextPassword || '', 'Password')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      title="Copy Password"
                    >
                      <Copy size={16} />
                    </button>
                    {currentUser?.studentId === 'admin' && (
                      <button
                        onClick={() => handleDeleteStudent(student._id, student.name)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Permanently Delete Student"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </>
            )}
          />
        )}
      </div>
    </motion.div>
  );
};

export default StudentCredentials;
