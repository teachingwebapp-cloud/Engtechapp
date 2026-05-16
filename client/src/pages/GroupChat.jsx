import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Send, Trash2, Users, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';

const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');

const GroupChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('join_group_chat', {
      userId: user.id || user._id,
      userName: user.name,
      role: user.role,
      studentId: user.studentId
    });

    newSocket.on('new_group_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(scrollToBottom, 100);
    });

    newSocket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.map(m => 
        m.messageId === messageId || m._id === messageId 
          ? { ...m, isDeleted: true, message: '[Message deleted]' } 
          : m
      ));
    });

    return () => {
      newSocket.emit('leave_group_chat');
      newSocket.disconnect();
    };
  }, [user]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/group-chat/messages?limit=100');
      // Messages come back in oldest-first order due to reverse() in backend
      setMessages(res.data.messages || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await api.post('/group-chat/messages', { message: newMessage });
      setNewMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await api.delete(`/group-chat/messages/${id}`);
      toast.success('Message deleted');
      // The socket event will handle updating the UI for everyone including us
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-faint)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} style={{ color: 'var(--primary)' }} />
            Community Chat
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Global discussion space for all students and teachers.</p>
        </div>
        
        {user.role === 'admin' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--warning-faint)', color: 'var(--warning)', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
            <AlertCircle size={16} /> Admin Mode
          </div>
        )}
      </div>

      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-color)' }}>
          {messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No messages yet. Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              // Ensure we have an ID to use for the key
              const msgId = msg._id || msg.messageId;
              const isMe = msg.senderId === user.id || msg.senderId === user._id;
              const isAdmin = msg.senderRole === 'admin';
              const isTeacher = msg.senderRole === 'teacher';
              
              let bubbleColor = isMe ? 'var(--primary)' : 'var(--surface)';
              let textColor = isMe ? 'white' : 'var(--text-main)';
              
              if (msg.messageColor === 'green') {
                bubbleColor = isMe ? 'var(--primary)' : 'rgba(34, 197, 94, 0.1)';
                if (!isMe) textColor = 'rgb(21, 128, 61)';
              } else if (msg.messageColor === 'red') {
                bubbleColor = isMe ? 'var(--primary)' : 'rgba(239, 68, 68, 0.1)';
                if (!isMe) textColor = 'rgb(185, 28, 28)';
              }

              return (
                <div key={msgId || index} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%'
                }}>
                  {!isMe && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', paddingLeft: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{msg.senderName}</span>
                      <span style={{ opacity: 0.7 }}>{msg.senderStudentId}</span>
                      {isAdmin && <span style={{ backgroundColor: 'var(--warning)', color: 'white', padding: '0 0.25rem', borderRadius: '0.25rem', fontSize: '0.65rem' }}>Admin</span>}
                      {isTeacher && <span style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0 0.25rem', borderRadius: '0.25rem', fontSize: '0.65rem' }}>Teacher</span>}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <div style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: bubbleColor,
                      color: textColor,
                      borderRadius: isMe ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                      boxShadow: 'var(--shadow-sm)',
                      border: isMe ? 'none' : '1px solid var(--border-color)',
                      wordBreak: 'break-word',
                      opacity: msg.isDeleted ? 0.6 : 1,
                      fontStyle: msg.isDeleted ? 'italic' : 'normal'
                    }}>
                      {msg.message}
                    </div>
                    
                    {/* Admin delete button */}
                    {!msg.isDeleted && (user.role === 'admin' || user.role === 'teacher') && (
                      <button 
                        onClick={() => handleDeleteMessage(msgId)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.5, transition: '0.2s', padding: '0.25rem' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
                        title="Delete message"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.25rem', padding: '0 0.5rem' }}>
                    {formatTime(msg.createdAt)}
                    {msg.isDeleted && msg.deletedByRole && <span style={{ marginLeft: '0.5rem', color: 'var(--danger)' }}>(Deleted by {msg.deletedByRole})</span>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--surface)', display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '0.875rem 1.25rem',
              borderRadius: '2rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none',
              fontSize: '0.95rem'
            }}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: newMessage.trim() && !sending ? 'var(--primary)' : 'var(--border-color)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
              transition: '0.2s flex-shrink-0'
            }}
          >
            <Send size={18} style={{ marginLeft: '2px' }} />
          </button>
        </form>
      </Card>
    </motion.div>
  );
};

export default GroupChat;
