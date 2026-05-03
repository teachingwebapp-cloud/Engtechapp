import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import {
  Activity, Search, Calendar, Download, Filter, User, Clock,
  Shield, LogOut, LogIn, Video, DoorOpen, UserPlus, Key, FileText, Eye, Copy, Lock
} from 'lucide-react';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    if (showCredentials) {
      fetchStudents();
    } else {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, startDate, endDate, currentPage, showCredentials]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (action) params.append('action', action);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', currentPage);
      params.append('limit', 25);
      const res = await api.get(`/activity-logs?${params.toString()}`);
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load activity logs');
    } finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=student');
      setStudents(res.data.users || []);
    } catch (err) {
      toast.error('Failed to load student credentials');
    } finally { setLoading(false); }
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

  const getActionBadgeVariant = (action) => {
    const map = { login: 'primary', logout: 'secondary', class_join: 'success', class_leave: 'warning', create_student: 'primary', enroll_students: 'success', password_change: 'danger' };
    return map[action] || 'gray';
  };

  const getActionIcon = (action) => {
    const map = { login: <LogIn size={16}/>, logout: <LogOut size={16}/>, class_join: <Video size={16}/>, class_leave: <DoorOpen size={16}/>, create_student: <UserPlus size={16}/>, enroll_students: <FileText size={16}/>, password_change: <Key size={16}/> };
    return map[action] || <Activity size={16}/>;
  };

  const handleDownloadCSV = () => {
    if (logs.length === 0) return toast.error('No logs to download');
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Details', 'IP Address'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.timestamp).toLocaleString(), log.userId?.name || 'Unknown', log.userId?.role || 'N/A',
        log.action, `"${log.details || ''}"`, log.ipAddress || 'N/A'
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('Activity logs exported successfully');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>
            {showCredentials ? 'Student Credentials Manager' : 'System Activity Logs'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
            {showCredentials ? 'View and manage all student login credentials.' : 'Monitor and audit all user actions across the platform.'}
          </p>
        </div>
        <div className="page-header-actions">
          <Button
            variant={showCredentials ? "primary" : "secondary"}
            onClick={() => setShowCredentials(!showCredentials)}
            icon={showCredentials ? <Activity size={18} /> : <Lock size={18} />}
          >
            {showCredentials ? 'Activity Logs' : 'View Credentials'}
          </Button>
          {!showCredentials && (
            <Button variant="outline" onClick={handleDownloadCSV} icon={<Download size={18} />} disabled={logs.length === 0}>
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {!showCredentials && (
        <Card style={{ marginBottom: '2rem' }}>
          <div className="filter-grid">
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                <Filter size={14} /> Filter by Action
              </label>
              <select value={action} onChange={(e) => { setAction(e.target.value); setCurrentPage(1); }}>
                <option value="">All Activities</option>
                <option value="login">Login Events</option>
                <option value="logout">Logout Events</option>
                <option value="class_join">Class Joins</option>
                <option value="class_leave">Class Leaves</option>
                <option value="create_student">New Student Creations</option>
                <option value="enroll_students">Enrollment Activities</option>
                <option value="password_change">Security Updates</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                <Calendar size={14} /> Start Date
              </label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                <Calendar size={14} /> End Date
              </label>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} />
            </div>
          </div>
        </Card>
      )}

      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '1.25rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-faint)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>
              {showCredentials ? 'Loading student credentials...' : 'Fetching latest logs...'}
            </p>
          </div>
        ) : (
          <>
            {showCredentials ? (
              <Table
                headers={['Student Name', 'Student ID', 'Password', 'Phone', 'Actions']}
                data={students}
                emptyMessage="No students found."
                renderRow={(student) => (
                  <>
                    <td data-label="Name" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                          {student.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {student.name || 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td data-label="Student ID" style={{ padding: '1.25rem' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                        {student.studentId}
                      </div>
                    </td>
                    <td data-label="Password" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', color: visiblePasswords[student._id] ? 'var(--danger)' : 'var(--text-light)' }}>
                          {visiblePasswords[student._id] ? student.plainTextPassword || 'N/A (changed)' : '••••••••'}
                        </div>
                        <button
                          onClick={() => togglePasswordVisibility(student._id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem', minHeight: '36px' }}
                          title={visiblePasswords[student._id] ? 'Hide' : 'Show'}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                    <td data-label="Phone" style={{ padding: '1.25rem' }}>
                      {student.phone || 'N/A'}
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div className="table-action-group">
                        <button
                          onClick={() => copyToClipboard(student.studentId, 'Student ID')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.5rem', minHeight: '36px' }}
                          title="Copy ID"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(student.plainTextPassword || '', 'Password')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.5rem', minHeight: '36px' }}
                          title="Copy Password"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              />
            ) : (
            <Table 
              headers={['Timestamp', 'User Profile', 'Action', 'Details', 'Network IP']}
              data={logs}
              emptyMessage="No activity logs found matching your criteria."
              renderRow={(log) => (
                <>
                  <td data-label="Time" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <Clock size={14} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: '1.375rem' }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </td>
                  <td data-label="User" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                        {log.userId?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>{log.userId?.name || 'Unknown User'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>{log.userId?.studentId || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Action" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ color: `var(--${getActionBadgeVariant(log.action)})`, flexShrink: 0 }}>{getActionIcon(log.action)}</div>
                      <Badge variant={getActionBadgeVariant(log.action)}>{log.action.replace('_', ' ').toUpperCase()}</Badge>
                    </div>
                  </td>
                  <td data-label="Details" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                      {log.details || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No additional details</span>}
                    </div>
                  </td>
                  <td data-label="IP" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      <Shield size={12} />
                      {log.ipAddress || '0.0.0.0'}
                    </div>
                  </td>
                </>
              )}
            />
            )}
            {pagination.pages > 1 && !showCredentials && (
              <div style={{ padding: '1.25rem 2rem', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Page <strong>{currentPage}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} total)
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button size="sm" variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Previous</Button>
                  <Button size="sm" variant="secondary" disabled={currentPage === pagination.pages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ActivityLogs;
