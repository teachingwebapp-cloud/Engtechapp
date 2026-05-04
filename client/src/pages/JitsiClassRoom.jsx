import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import PermissionRequestPanel from '../components/PermissionRequestPanel';
import TeacherPermissionPanel from '../components/TeacherPermissionPanel';
import usePermissions from '../hooks/usePermissions';
import ClassroomChat from '../components/ClassroomChat';
import { MessageCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');

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
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [globalSocket, setGlobalSocket] = useState(null);
  const jitsiContainerContext = useRef(null);
  const jitsiApiRef = useRef(null);
  const joinTimeRef = useRef(Date.now());

  // Permission handling — for students
  const { permissionStatus, requestPermission, checkStatus } = usePermissions(id);
  const permissionStatusRef = useRef(permissionStatus);

  useEffect(() => {
    permissionStatusRef.current = permissionStatus;
  }, [permissionStatus]);

  const checkStatusRef = useRef(checkStatus);
  useEffect(() => { checkStatusRef.current = checkStatus; }, [checkStatus]);

  // Socket for real-time permission updates — using a ref to avoid stale closures
  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    setGlobalSocket(socket);

    socket.emit('join_class', {
      classId: id,
      role: user.role,
      studentId: user.studentId,
      userName: user.name
    });

    if (user.role === 'admin') {
      socket.on('new_permission_request', (data) => {
        toast(`${data.studentName} is requesting ${data.requestType} access.`, { icon: '🔔', duration: 5000 });
        setUpdateTrigger(prev => prev + 1);
      });
    } else if (user.role === 'student') {
      socket.on('permission_approved', (data) => {
        toast.success(`✅ Your ${data.requestType} was approved! You can turn it on now.`, { duration: 5000 });
        checkStatusRef.current(data.requestType);
      });
      socket.on('permission_denied', (data) => {
        toast.error(`❌ ${data.requestType} request denied: ${data.reason}`, { duration: 6000 });
        checkStatusRef.current(data.requestType);
      });
      socket.on('permission_revoked', (data) => {
        toast.error(`🔇 Your ${data.requestType} was muted by the teacher.`, { duration: 5000 });
        checkStatusRef.current(data.requestType);
        // Auto-mute the student's media via Jitsi API
        try {
          if (jitsiApiRef.current) {
            if (data.requestType === 'microphone') {
              jitsiApiRef.current.isAudioMuted().then(muted => {
                if (!muted) jitsiApiRef.current.executeCommand('toggleAudio');
              }).catch(() => {});
            } else if (data.requestType === 'camera') {
              jitsiApiRef.current.isVideoMuted().then(muted => {
                if (!muted) jitsiApiRef.current.executeCommand('toggleVideo');
              }).catch(() => {});
            }
          }
        } catch (e) { /* ignore */ }
      });
    }

    return () => { socket.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.role, user?.studentId, user?.name]);

  // Fetch Jitsi config from server
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get(`/classes/${id}/join`);
        setJitsiConfig(res.data.jitsiConfig);
        setClassTitle(res.data.classTitle || res.data.jitsiConfig?.roomName || '');
        setSessionId(res.data.sessionId);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to join class. Are you enrolled?');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [id]);

  const logClassExit = useCallback(async () => {
    try {
      const durationSeconds = Math.floor((Date.now() - joinTimeRef.current) / 1000);
      await api.post(`/classes/${id}/leave`, { sessionId, durationSeconds });
    } catch (err) { console.error('Failed to log class exit:', err); }
  }, [id, sessionId]);

  // Initialize Jitsi
  useEffect(() => {
    if (!jitsiConfig || !jitsiContainerContext.current) return;

    let apiInstance = null;
    let delayId = null;

    const initJitsi = () => {
      delayId = setTimeout(() => {
        if (!jitsiContainerContext.current) return;
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
          if (jitsiConfig.userInfo?.displayName) {
            apiInstance.executeCommand('displayName', jitsiConfig.userInfo.displayName);
          }
        });

        // Intercept student media buttons — lock if no permission granted
        apiInstance.addListener('audioMuteStatusChanged', ({ muted }) => {
          if (user?.role === 'student' && !muted) {
            if (!permissionStatusRef.current.microphone?.allowed) {
              apiInstance.executeCommand('toggleAudio');
              toast.error('🎤 Microphone locked. Requesting permission from teacher...');
              requestPermission('microphone');
            }
          }
        });

        apiInstance.addListener('videoMuteStatusChanged', ({ muted }) => {
          if (user?.role === 'student' && !muted) {
            if (!permissionStatusRef.current.camera?.allowed) {
              apiInstance.executeCommand('toggleVideo');
              toast.error('📹 Camera locked. Requesting permission from teacher...');
              requestPermission('camera');
            }
          }
        });

        apiInstance.addListener('screenSharingStatusChanged', ({ on }) => {
          if (user?.role === 'student' && on) {
            if (!permissionStatusRef.current.screen?.allowed) {
              try { apiInstance.executeCommand('toggleShareScreen'); } catch (e) {}
              toast.error('🖥️ Screen share locked. Requesting permission from teacher...');
              requestPermission('screen');
            }
          }
        });

        apiInstance.addListener('readyToClose', () => {
          logClassExit().then(() => {
            if (user?.role === 'admin') navigate('/teacher/dashboard');
            else navigate('/student/dashboard');
          });
        });
      }, 150);
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

    return () => {
      if (delayId) clearTimeout(delayId);
      if (apiInstance) {
        try {
          apiInstance.executeCommand('hangup');
          apiInstance.dispose();
        } catch (e) { console.error('Error disposing Jitsi:', e); }
      }
    };
  }, [jitsiConfig, navigate, user?.role, requestPermission, logClassExit]);

  // --- Render guards ---
  if (!user) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', color: '#fff', fontSize: '1rem' }}>
      Authenticating...
    </div>
  );

  if (loading) return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem', background: '#0f0f1a', color: '#fff' }}>
      <div style={{ width: 48, height: 48, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#aaa', fontSize: '1rem' }}>Loading Secure Classroom...</p>
    </div>
  );

  if (error) return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem', background: '#0f0f1a', color: '#fff', padding: '1rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--danger)' }}>⚠️ Access Denied</h2>
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
          {user?.role === 'student' && (
            <span className="jitsi-role-label" style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)' }}>
              🔇 Muted by default · Use buttons to request access
            </span>
          )}
          {user?.role === 'admin' && (
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
          position: 'absolute', right: '20px', bottom: '20px',
          width: '50px', height: '50px', borderRadius: '25px',
          backgroundColor: '#4f46e5', color: 'white', border: 'none',
          boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 100, transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat */}
      <ClassroomChat classId={id} user={user} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} providedSocket={globalSocket} />

      {/* Permission Panels */}
      {user?.role === 'student' && <PermissionRequestPanel classId={id} isVisible={true} />}
      {user?.role === 'admin' && <TeacherPermissionPanel classId={id} isVisible={true} updateTrigger={updateTrigger} />}
    </div>
  );
};

export default JitsiClassRoom;
