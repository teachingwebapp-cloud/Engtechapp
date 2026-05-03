import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, User, ShieldAlert, MessageCircle, X } from 'lucide-react';
import Button from './ui/Button';

// Resolve appropriate backend URL
const SOCKET_URL = import.meta.env.PROD 
  ? window.location.origin 
  : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');

// Sanitize text to prevent XSS
const sanitizeText = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const ClassroomChat = ({ classId, user, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize Socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Join room
    newSocket.emit('join_class', {
      classId,
      role: user.role,
      studentId: user.studentId,
      userName: user.name
    });

    // Listen for incoming messages
    newSocket.on('receive_message', (message) => {
      setMessages(prev => {
        // Prevent duplicate IDs (edge case from echoes)
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    // Handle socket errors
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => newSocket.close();
  }, [classId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    const trimmedText = inputText.trim();
    if (trimmedText.length > 1000) {
      alert('Message is too long. Maximum 1000 characters.');
      return;
    }

    if (user.role === 'student') {
      socket.emit('student_send_message', { text: trimmedText });
    } else {
      socket.emit('teacher_send_message', { text: trimmedText, targetStudentId: 'all' });
    }
    
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      right: '20px',
      bottom: '80px',
      width: '320px',
      height: '450px',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      border: '1px solid #334155',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          <MessageCircle size={18} className="text-primary" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Classroom Chat</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {user.role === 'student' && (
        <div style={{ background: 'rgba(99,102,241,0.1)', padding: '8px 12px', fontSize: '0.75rem', color: '#a5b4fc', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <ShieldAlert size={14} /> Only visible to your Instructor
        </div>
      )}

      {/* Message List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <div style={{ margin: 'auto', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
            No messages yet.<br/>Type below to start chatting.
          </div>
        )}
        
        {messages.map((msg) => {
          const isMine = msg.senderId === user.studentId;
          const isTeacher = msg.role === 'admin';
          
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px', marginLeft: '4px', marginRight: '4px' }}>
                {isMine ? 'You' : msg.senderName} {isTeacher && !isMine && <span style={{ color: '#6ee7b7' }}>(Host)</span>}
              </div>
              <div style={{
                background: isMine ? '#4f46e5' : '#334155',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '12px',
                borderBottomRightRadius: isMine ? '2px' : '12px',
                borderTopLeftRadius: !isMine ? '2px' : '12px',
                fontSize: '0.85rem',
                maxWidth: '85%',
                wordBreak: 'break-word',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeText(msg.text) }}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid #334155', display: 'flex', gap: '8px', backgroundColor: '#0f172a' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={user.role === 'student' ? "Ask the instructor..." : "Broadcast to class..."}
          maxLength={1000}
          style={{ flex: 1, background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
        />
        <Button size="sm" type="submit" disabled={!inputText.trim()} style={{ padding: '8px 12px' }}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
};

export default ClassroomChat;
