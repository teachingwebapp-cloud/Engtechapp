import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { toast } from 'react-hot-toast';

const MyActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (action) params.append('action', action);
      params.append('limit', 50);
      const res = await api.get(`/activity-logs?${params.toString()}`);
      setLogs(res.data.logs || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load activity logs');
    } finally { setLoading(false); }
  };

  const getActionBadgeVariant = (action) => {
    const map = { login: 'primary', logout: 'secondary', class_join: 'primary', class_leave: 'secondary', password_change: 'warning' };
    return map[action] || 'gray';
  };

  const getActionIcon = (action) => {
    const map = { login: '🔓', logout: '🔐', class_join: '📹', class_leave: '🚪', password_change: '🔑' };
    return map[action] || '📋';
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading your activity logs...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>My Activity</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>View your login history and class attendance</p>
      </div>

      <Card style={{ marginBottom: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Filter by Action</label>
          <select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All Actions</option>
            <option value="login">🔓 Login</option>
            <option value="logout">🔐 Logout</option>
            <option value="class_join">📹 Class Join</option>
            <option value="class_leave">🚪 Class Leave</option>
            <option value="password_change">🔑 Password Change</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          headers={['Action', 'Class / Details', 'Time']}
          data={logs}
          emptyMessage="No activity logs found."
          renderRow={(log) => (
            <>
              <td style={{ padding: '1rem' }}>
                <Badge variant={getActionBadgeVariant(log.action)}>
                  {getActionIcon(log.action)} {log.action?.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </td>
              <td style={{ padding: '1rem', maxWidth: '400px', wordBreak: 'break-word', fontSize: '0.9rem' }}>
                {log.classId?.title && <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{log.classId.title}</div>}
                <div style={{ color: 'var(--text-muted)' }}>{log.details || '—'}</div>
              </td>
              <td style={{ padding: '1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                {new Date(log.timestamp).toLocaleString()}
              </td>
            </>
          )}
        />
      </Card>

      <Card style={{ marginTop: '2rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid rgb(59, 130, 246)' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>📋 What is tracked?</h3>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            <li>Login and logout events with timestamps</li>
            <li>Each class you join and leave (duration tracked)</li>
            <li>Password changes and security updates</li>
            <li>All activities are visible to your instructor</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default MyActivityLogs;
