import React, { useEffect, useState } from 'react';
import { FiMic, FiVideo, FiShare2 } from 'react-icons/fi';
import usePermissions from '../hooks/usePermissions';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Card from './ui/Card';

const PermissionRequestPanel = ({ classId, isVisible = true }) => {
  const {
    permissionStatus,
    checkStatus,
    requestPermission,
    getMyRequests,
    requests,
    loading
  } = usePermissions(classId);

  const [showPanel, setShowPanel] = useState(isVisible);

  useEffect(() => {
    checkStatus('microphone');
    checkStatus('camera');
    checkStatus('screen');
    getMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const handleRequestClick = async (requestType) => {
    const request = await requestPermission(requestType);
    if (request) {
      getMyRequests();
    }
  };

  const getStatusBadge = (requestType) => {
    const status = permissionStatus[requestType];
    if (status.allowed) {
      return (
        <Badge variant="success">
          ✓ Enabled {status.visibility === 'class' && '(Class)'}
        </Badge>
      );
    }

    const req = requests.find(r => r.requestType === requestType);
    if (req?.status === 'pending') {
      return <Badge variant="warning">⏳ Pending</Badge>;
    }
    if (req?.status === 'denied') {
      return <Badge variant="danger">✗ Denied</Badge>;
    }
    return <Badge variant="gray">Not Enabled</Badge>;
  };

  if (!showPanel) return null;

  return (
    <Card
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        width: '360px',
        maxWidth: '90vw',
        zIndex: 1000,
        backgroundColor: 'var(--surface)',
        borderRadius: '1rem',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-color)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>🎤 Media Permissions</h3>
        <button
          onClick={() => setShowPanel(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 0
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Microphone Request */}
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiMic size={18} color="var(--primary)" />
              <span style={{ fontWeight: 500 }}>Microphone</span>
            </div>
            {getStatusBadge('microphone')}
          </div>
          {!permissionStatus.microphone.allowed && (
            <Button
              size="sm"
              fullWidth
              onClick={() => handleRequestClick('microphone')}
              disabled={loading || requests.some(r => r.requestType === 'microphone' && r.status === 'pending')}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'Requesting...' : 'Request Permission'}
            </Button>
          )}
        </div>

        {/* Camera Request */}
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiVideo size={18} color="var(--accent)" />
              <span style={{ fontWeight: 500 }}>Camera</span>
            </div>
            {getStatusBadge('camera')}
          </div>
          {!permissionStatus.camera.allowed && (
            <Button
              size="sm"
              fullWidth
              onClick={() => handleRequestClick('camera')}
              disabled={loading || requests.some(r => r.requestType === 'camera' && r.status === 'pending')}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'Requesting...' : 'Request Permission'}
            </Button>
          )}
        </div>

        {/* Screen Share Request */}
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiShare2 size={18} color="var(--warning)" />
              <span style={{ fontWeight: 500 }}>Screen Share</span>
            </div>
            {getStatusBadge('screen')}
          </div>
          {!permissionStatus.screen.allowed && (
            <Button
              size="sm"
              fullWidth
              onClick={() => handleRequestClick('screen')}
              disabled={loading || requests.some(r => r.requestType === 'screen' && r.status === 'pending')}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'Requesting...' : 'Request Permission'}
            </Button>
          )}
        </div>

        {/* Denied Requests Info */}
        {requests.some(r => r.status === 'denied') && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid rgb(239, 68, 68)',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            color: 'rgb(239, 68, 68)'
          }}>
            <strong>⚠️ Denied Requests:</strong>
            {requests.filter(r => r.status === 'denied').map(r => (
              <div key={r._id} style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                {r.requestType}: {r.denialReason}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-color)'
      }}>
        💡 Request permissions from your teacher to enable media features
      </div>
    </Card>
  );
};

export default PermissionRequestPanel;
