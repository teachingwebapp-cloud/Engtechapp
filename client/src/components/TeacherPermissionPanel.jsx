import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiUsers, FiMicOff, FiVideoOff } from 'react-icons/fi';
import api from '../api/axios';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { toast } from 'react-hot-toast';

const TeacherPermissionPanel = ({ classId, isVisible = true, onRequestUpdate, updateTrigger }) => {
  const [showPanel, setShowPanel] = useState(isVisible);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'active'
  const [requests, setRequests] = useState({ pending: [], approved: [] });
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [visibility, setVisibility] = useState('individual');
  const [denyReason, setDenyReason] = useState('');
  const [showDenyModal, setShowDenyModal] = useState(false);

  useEffect(() => {
    if (showPanel && classId) {
      fetchRequests();
      const interval = setInterval(fetchRequests, 5000); // Keep polling as a backup
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, showPanel, updateTrigger]);

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/permissions/requests/${classId}`);
      setRequests({
        pending: res.data.grouped.pending || [],
        approved: res.data.grouped.approved || []
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setLoading(true);
    try {
      await api.patch(`/permissions/requests/${selectedRequest._id}/approve`, { visibility });
      toast.success(`Permission approved for ${selectedRequest.studentId.name}`);
      setShowApprovalModal(false);
      fetchRequests();
      onRequestUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!selectedRequest) return;
    setLoading(true);
    try {
      await api.patch(`/permissions/requests/${selectedRequest._id}/deny`, {
        reason: denyReason || 'Request denied by teacher'
      });
      toast.success(`Permission denied for ${selectedRequest.studentId.name}`);
      setShowDenyModal(false);
      setDenyReason('');
      fetchRequests();
      onRequestUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deny');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (request) => {
    if (window.confirm(`Are you sure you want to mute/revoke ${request.requestType} for ${request.studentId.name}?`)) {
      setLoading(true);
      try {
        await api.patch(`/permissions/requests/${request._id}/revoke`);
        toast.success(`${request.requestType} access revoked for ${request.studentId.name}`);
        fetchRequests();
        onRequestUpdate?.();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to revoke permission');
      } finally {
        setLoading(false);
      }
    }
  };

  const getRequestIcon = (requestType) => {
    switch (requestType) {
      case 'microphone': return '🎤';
      case 'camera': return '📹';
      case 'screen': return '🖥️';
      default: return '❓';
    }
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          fontWeight: 'bold'
        }}
        title={`${requests.pending.length} pending requests`}
      >
        🔔
        {requests.pending.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: 'rgb(239, 68, 68)',
              color: 'white',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              border: '2px solid var(--surface)'
            }}
          >
            {requests.pending.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <Card
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '420px',
          maxWidth: '90vw',
          maxHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          backgroundColor: 'var(--surface)',
          borderRadius: '1rem',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden' // So tabs don't scroll
        }}
      >
        <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            🔔 Permissions
          </h3>
          <button
            onClick={() => setShowPanel(false)}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 1rem' }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              flex: 1, padding: '0.75rem', background: 'none', border: 'none',
              borderBottom: activeTab === 'pending' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'pending' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'pending' ? 600 : 400,
              cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
            }}
          >
            Pending
            {requests.pending.length > 0 && (
              <Badge variant="danger" style={{ fontSize: '0.7rem' }}>{requests.pending.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              flex: 1, padding: '0.75rem', background: 'none', border: 'none',
              borderBottom: activeTab === 'active' ? '2px solid var(--success)' : '2px solid transparent',
              color: activeTab === 'active' ? 'var(--success)' : 'var(--text-muted)',
              fontWeight: activeTab === 'active' ? 600 : 400,
              cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
            }}
          >
            Active
            {requests.approved.length > 0 && (
              <Badge variant="success" style={{ fontSize: '0.7rem' }}>{requests.approved.length}</Badge>
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.5rem' }}>
          {activeTab === 'pending' && (
            requests.pending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>✓ All caught up!</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>No pending permission requests</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requests.pending.map(request => (
                  <div key={request._id} style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                          {getRequestIcon(request.requestType)} {request.studentId.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {request.studentId.studentId}</div>
                      </div>
                      <Badge variant="warning"><FiClock size={14} style={{ marginRight: '0.25rem' }} /> Pending</Badge>
                    </div>
                    <div style={{ fontSize: '0.875rem', backgroundColor: 'var(--surface)', padding: '0.5rem', borderRadius: '0.5rem', fontWeight: 500 }}>
                      Requests: <strong>{request.requestType.toUpperCase()}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <Button size="sm" variant="success" fullWidth onClick={() => { setSelectedRequest(request); setShowApprovalModal(true); }} style={{ flex: 1 }}>
                        <FiCheckCircle size={16} style={{ marginRight: '0.25rem' }} /> Approve
                      </Button>
                      <Button size="sm" variant="danger" fullWidth onClick={() => { setSelectedRequest(request); setShowDenyModal(true); }} style={{ flex: 1 }}>
                        <FiXCircle size={16} style={{ marginRight: '0.25rem' }} /> Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'active' && (
            requests.approved.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>No active student media permissions.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requests.approved.map(request => (
                  <div key={request._id} style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem', borderLeft: '4px solid var(--success)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                          {getRequestIcon(request.requestType)} {request.studentId.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {request.studentId.studentId}</div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <div style={{ fontSize: '0.875rem', backgroundColor: 'var(--surface)', padding: '0.5rem', borderRadius: '0.5rem', fontWeight: 500 }}>
                      Type: <strong>{request.requestType.toUpperCase()}</strong>
                    </div>
                    <Button size="sm" variant="danger" fullWidth onClick={() => handleRevoke(request)} disabled={loading}>
                      {request.requestType === 'microphone' ? <FiMicOff size={16} style={{ marginRight: '0.25rem' }} /> : <FiVideoOff size={16} style={{ marginRight: '0.25rem' }} />}
                      Revoke (Mute)
                    </Button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </Card>

      {/* Approval Modal */}
      <Modal isOpen={showApprovalModal} onClose={() => { setShowApprovalModal(false); setSelectedRequest(null); }} title={`Approve ${selectedRequest?.requestType} for ${selectedRequest?.studentId?.name}`}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.95rem' }}>Who should see/hear this?</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div onClick={() => setVisibility('individual')} style={{ padding: '1rem', border: visibility === 'individual' ? '2px solid var(--primary)' : '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer', backgroundColor: visibility === 'individual' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)', transition: 'all 0.2s' }}>
              <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>👁️ Only You (Teacher)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Only you can see/hear this student's media</div>
            </div>
            <div onClick={() => setVisibility('class')} style={{ padding: '1rem', border: visibility === 'class' ? '2px solid var(--primary)' : '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer', backgroundColor: visibility === 'class' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)', transition: 'all 0.2s' }}>
              <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}><FiUsers size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Entire Class</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All students and you can see/hear this student's media</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" fullWidth onClick={() => { setShowApprovalModal(false); setSelectedRequest(null); }} disabled={loading}>Cancel</Button>
          <Button fullWidth onClick={handleApprove} disabled={loading}>{loading ? 'Approving...' : 'Approve Permission'}</Button>
        </div>
      </Modal>

      {/* Deny Modal */}
      <Modal isOpen={showDenyModal} onClose={() => { setShowDenyModal(false); setSelectedRequest(null); setDenyReason(''); }} title={`Deny ${selectedRequest?.requestType} for ${selectedRequest?.studentId?.name}`}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.95rem' }}>Reason (Optional)</label>
          <textarea value={denyReason} onChange={(e) => setDenyReason(e.target.value)} placeholder="e.g., Class is in discussion mode, Microphone quality issues..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical', minHeight: '100px' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" fullWidth onClick={() => { setShowDenyModal(false); setSelectedRequest(null); setDenyReason(''); }} disabled={loading}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleDeny} disabled={loading}>{loading ? 'Denying...' : 'Deny Permission'}</Button>
        </div>
      </Modal>
    </>
  );
};

export default TeacherPermissionPanel;
