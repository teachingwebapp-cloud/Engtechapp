import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import {
  Search, UserPlus, Filter, UserX, UserCheck, Phone, Calendar, Shield, Trash2, KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?limit=200&includePasswords=true');
      setUsers(res.data.users || []);
    } catch (_err) {
      toast.error(_err?.response?.data?.message || 'Failed to load users');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/users/${id}/status`);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`⚠️ Are you sure you want to PERMANENTLY DELETE the user "${name}"?\n\nThis cannot be undone.`)) {
      try {
        await api.delete(`/users/${id}`);
        toast.success(`User ${name} permamently deleted.`);
        fetchUsers();
      } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading && users.length === 0) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-faint)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>Users Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>Manage {users.length} registered accounts and their access levels.</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={() => navigate('/teacher/create-student')} icon={<UserPlus size={18} />}>Create New User</Button>
        </div>
      </div>

      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface)', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </Card>

      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '1.25rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <Table 
          headers={['User Profile', 'Contact', 'Credentials', 'Role & Status', 'Joined Date', 'Actions']}
          data={filteredUsers}
          emptyMessage="No users matching your filters were found."
          renderRow={(u) => (
            <>
              <td data-label="User" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-faint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.studentId}</div>
                  </div>
                </div>
              </td>
              <td data-label="Phone" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <Phone size={14} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                  {u.phone || 'No phone'}
                </div>
              </td>
              <td data-label="Password" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  <KeyRound size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                  {currentUser.studentId === 'admin' ? (u.plainTextPassword || <span style={{ color: 'var(--text-muted)' }}>Encrypted</span>) : '••••••••'}
                </div>
              </td>
              <td data-label="Role" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Badge variant={u.role === 'admin' ? 'danger' : 'primary'}>{u.role.toUpperCase()}</Badge>
                  <Badge variant={u.isActive ? 'success' : 'gray'}>{u.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
                </div>
              </td>
              <td data-label="Joined" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <Calendar size={14} />
                  {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </td>
              <td style={{ padding: '1.25rem' }}>
                <div className="table-action-group">
                  {u.role !== 'admin' && (
                    <Button size="sm" variant={u.isActive ? 'secondary' : 'primary'} onClick={() => handleToggleStatus(u._id, u.isActive)}
                      icon={u.isActive ? <UserX size={16} /> : <UserCheck size={16} />} title={u.isActive ? 'Deactivate User' : 'Activate User'}
                    >
                      {u.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  )}
                  {currentUser.studentId === 'admin' && u._id !== currentUser.id && (
                    <Button size="sm" variant="danger" onClick={() => handleDeleteUser(u._id, u.name)} icon={<Trash2 size={16} />} title="Permanently Delete" />
                  )}
                </div>
              </td>
            </>
          )}
        />
      </div>
    </motion.div>
  );
};

export default UsersManagement;
