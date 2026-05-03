import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import PermissionRequestPanel from '../components/PermissionRequestPanel';
import TeacherPermissionPanel from '../components/TeacherPermissionPanel';

import ClassroomChat from '../components/ClassroomChat';
import { MessageCircle } from 'lucide-react';

const JitsiClassRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jitsiLoading, setJitsiLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jitsiConfig, setJitsiConfig] = useState(null);
  const [classTitle, setClassTitle] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const jitsiContainerContext = useRef(null);
  const jitsiApiRef = useRef(null);
  const joinTimeRef = useRef(Date.now());

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get(`/classes/${id}/join`);
        setJitsiConfig(res.data.jitsiConfig);
        setClassTitle(res.data.classTitle || res.data.jitsiConfig?.roomName || '');
        setSessionId(res.data.sessionId);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to join class. Are you enrolled?');
      } finally { setLoading(false); }
    };
    fetchConfig();
  }, [id]);

  const logClassExit = async () => {
    try {
      const durationSeconds = Math.floor((Date.now() - joinTimeRef.current) / 1000);
      await api.post(`/classes/${id}/leave`, { sessionId, durationSeconds });
    } catch (err) { console.error('Failed to log class exit:', err); }
  };

  useEffect(() => {
    if (!jitsiConfig || !jitsiContainerContext.current) return;

    let apiInstance = null;
    let delayId = null;

    const initJitsi = () => {
      delayId = setTimeout(() => {
        if (!jitsiContainerContext.current) return;
        
        // Ensure container is empty before creating new instance
        jitsiContainerContext.current.innerHTML = '';
        
        const domain = 'meet.jit.si';
        const options = {
          ...jitsiConfig,
          parentNode: jitsiContainerContext.current,
          width: '100%',
          height: '100%',
        };

        apiInstance = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = apiInstance;

        const timeoutId = setTimeout(() => { setJitsiLoading(false); }, 3500);

        apiInstance.addListener('videoConferenceJoined', () => {
          clearTimeout(timeoutId);
          setJitsiLoading(false);
          // Set display name again just in case it didn't apply
          if (jitsiConfig.userInfo?.displayName) {
            apiInstance.executeCommand('displayName', jitsiConfig.userInfo.displayName);
          }
        });

        apiInstance.addListener('readyToClose', () => {
          logClassExit().then(() => {
            if (user?.role === 'admin') navigate('/teacher/dashboard');
            else navigate('/student/dashboard');
          });
        });
      }, 150); // Slight delay to allow DOM to settle
    };

    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => {
        setJitsiLoading(false);
        setError('Could not load classroom engine. Please check your internet connection.');
      };
      document.body.appendChild(script);
    } else {
      initJitsi();
    }

    // Strict cleanup function
    return () => {
      if (delayId) clearTimeout(delayId);
      if (apiInstance) {
        try {
          // Force hangup before disposing to cleanly disconnect from Jitsi server
          apiInstance.executeCommand('hangup');
          apiInstance.dispose();
        } catch (e) {
          console.error("Error disposing Jitsi instance:", e);
        }
      }
    };
  }, [jitsiConfig, navigate, user?.role]);

  if (loading) return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem', background: '#0f0f1a', color: '#fff' }}>
      <div style={{ width: 48, height: 48, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#aaa', fontSize: '1rem' }}>Loading Secure Classroom...</p>
    </div>
  );

  if (error) return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem', background: '#0f0f1a', color: '#fff', padding: '1rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--danger)' }}>Access Denied</h2>
      <p style={{ color: '#aaa', maxWidth: '400px' }}>{error}</p>
      <Button onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  return (
    <div style={{ width: '100vw', height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f0f1a' }}>
      {/* Toolbar */}
      <div className="jitsi-toolbar">
        <div className="jitsi-toolbar-left">
          <Button size="sm" variant="danger" onClick={() => {
            logClassExit().then(() => {
                if (user?.role === 'admin') navigate('/teacher/dashboard');
                else navigate('/student/dashboard');
            });
          }}>← Leave</Button>
          <span className="jitsi-toolbar-title">{classTitle}</span>
        </div>
        <div>
          {user.role === 'student' && (
            <span className="jitsi-role-label" style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)' }}>
              🔇 Muted by default · Raise Hand to speak
            </span>
          )}
          {user.role === 'admin' && (
            <span className="jitsi-role-label" style={{ color: '#6ee7b7', background: 'rgba(110,231,183,0.1)' }}>
              🎙️ You are the host
            </span>
          )}
        </div>
      </div>

      {/* Jitsi Container */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {jitsiLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', zIndex: 10, gap: '1rem' }}>
            <div style={{ width: 56, height: 56, border: '4px solid rgba(99,102,241,0.2)', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Connecting to secure meeting room...</p>
            <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Powered by Jitsi Meet</p>
          </div>
        )}
        <div id="jitsi-container" ref={jitsiContainerContext} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Floating Chat Toggle */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="jitsi-chat-fab"
        style={{
          position: 'absolute',
          right: '20px',
          bottom: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '25px',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageCircle size={24} />
      </button>

      {/* Secure Chat Component */}
      <ClassroomChat classId={id} user={user} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Permission Panels */}
      {user?.role === 'student' && <PermissionRequestPanel classId={id} isVisible={true} />}
      {user?.role === 'admin' && <TeacherPermissionPanel classId={id} isVisible={true} />}
    </div>
  );
};

export default JitsiClassRoom;
