# 💬 Group Chat Feature Documentation

## Overview
A comprehensive group chat system where admin, teachers, and students can communicate with role-based visibility, message tracking, and admin moderation capabilities.

---

## 🎯 Features

### ✅ Core Features
1. **Group Chat Only** - No private inbox, only one group chat for everyone
2. **Text Only** - No voice calls, no video calls, no audio messages
3. **Role-Based Colors**:
   - 🟢 **Admin messages**: Green
   - 🔴 **Teacher messages**: Red
   - ⚪ **Student messages**: White/Black (based on theme)

4. **Privacy Controls**:
   - Students see only **IDs** of other students
   - Students see **names + IDs** of admin/teachers
   - Admin/Teachers see **names + IDs** of everyone

5. **Admin Moderation**:
   - Track all messages
   - Delete any message
   - View deleted messages
   - Monitor chat statistics
   - Track who deleted what

6. **Real-Time Updates**:
   - Instant message delivery
   - Typing indicators
   - User join/leave notifications
   - Message deletion notifications

---

## 📡 API Endpoints

### Send Message
```http
POST /api/group-chat/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Hello everyone!"
}
```

**Response:**
```json
{
  "message": "Message sent successfully",
  "data": {
    "_id": "...",
    "senderId": "...",
    "senderRole": "student",
    "senderStudentId": "STU-001",
    "senderName": "STU-001",
    "message": "Hello everyone!",
    "messageColor": "default",
    "createdAt": "2026-05-07T10:00:00.000Z"
  }
}
```

### Get Messages
```http
GET /api/group-chat/messages?page=1&limit=50&includeDeleted=false
Authorization: Bearer <token>
```

**Response (Student View):**
```json
{
  "messages": [
    {
      "_id": "...",
      "senderRole": "admin",
      "senderStudentId": "admin",
      "senderName": "Admin User",
      "message": "Welcome to the group!",
      "messageColor": "green",
      "createdAt": "2026-05-07T10:00:00.000Z"
    },
    {
      "_id": "...",
      "senderRole": "student",
      "senderStudentId": "STU-001",
      "senderName": "STU-001",
      "message": "Thank you!",
      "messageColor": "default",
      "createdAt": "2026-05-07T10:01:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

**Response (Admin/Teacher View):**
```json
{
  "messages": [
    {
      "_id": "...",
      "senderRole": "student",
      "senderStudentId": "STU-001",
      "senderName": "John Doe",
      "message": "Thank you!",
      "isDeleted": false,
      "isEdited": false,
      "messageColor": "default",
      "createdAt": "2026-05-07T10:01:00.000Z"
    }
  ]
}
```

### Delete Message (Admin/Teacher Only)
```http
DELETE /api/group-chat/messages/:id
Authorization: Bearer <admin_or_teacher_token>
```

**Response:**
```json
{
  "message": "Message deleted successfully",
  "data": {
    "_id": "...",
    "isDeleted": true,
    "deletedAt": "2026-05-07T10:05:00.000Z",
    "deletedBy": "...",
    "deletedByRole": "admin"
  }
}
```

### Get Chat Statistics (Admin Only)
```http
GET /api/group-chat/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "stats": {
    "totalMessages": 1000,
    "activeMessages": 950,
    "deletedMessages": 50,
    "deletionRate": "5.00%"
  },
  "messagesByRole": {
    "admin": 100,
    "teacher": 200,
    "student": 700
  },
  "mostActiveUsers": [
    {
      "userId": "...",
      "name": "John Doe",
      "studentId": "STU-001",
      "role": "student",
      "messageCount": 150
    }
  ],
  "recentDeletions": [
    {
      "messageId": "...",
      "sender": "Jane Smith",
      "senderId": "STU-002",
      "message": "Inappropriate content...",
      "deletedBy": "Admin User",
      "deletedByRole": "admin",
      "deletedAt": "2026-05-07T10:00:00.000Z"
    }
  ]
}
```

### Get Deleted Messages (Admin Only)
```http
GET /api/group-chat/deleted?page=1&limit=50
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "messages": [
    {
      "_id": "...",
      "sender": {
        "name": "John Doe",
        "studentId": "STU-001",
        "role": "student"
      },
      "message": "Original message content",
      "deletedBy": {
        "name": "Admin User",
        "studentId": "admin",
        "role": "admin"
      },
      "deletedAt": "2026-05-07T10:00:00.000Z",
      "createdAt": "2026-05-07T09:55:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 50,
    "pages": 1
  }
}
```

### Get User Messages (Admin Only)
```http
GET /api/group-chat/user/:userId?page=1&limit=50&includeDeleted=true
Authorization: Bearer <admin_token>
```

---

## 🔌 Socket.io Events

### Client → Server

#### Join Group Chat
```javascript
socket.emit('join_group_chat', {
  userId: user._id,
  userName: user.name,
  role: user.role,
  studentId: user.studentId
});
```

#### Leave Group Chat
```javascript
socket.emit('leave_group_chat');
```

#### Typing Indicator
```javascript
socket.emit('typing', { isTyping: true });
// After 3 seconds or on send
socket.emit('typing', { isTyping: false });
```

### Server → Client

#### New Message
```javascript
socket.on('new_group_message', (data) => {
  // data = {
  //   messageId: "...",
  //   senderId: "...",
  //   senderRole: "student",
  //   senderStudentId: "STU-001",
  //   senderName: "John Doe" or "STU-001" (based on viewer role),
  //   message: "Hello!",
  //   messageColor: "default",
  //   createdAt: "2026-05-07T10:00:00.000Z"
  // }
  
  addMessageToUI(data);
});
```

#### Message Deleted
```javascript
socket.on('message_deleted', (data) => {
  // data = {
  //   messageId: "...",
  //   deletedBy: "Admin User",
  //   deletedByRole: "admin"
  // }
  
  updateMessageAsDeleted(data.messageId);
});
```

#### User Joined
```javascript
socket.on('user_joined', (data) => {
  // data = {
  //   userId: "...",
  //   userName: "John Doe" or "STU-001",
  //   role: "student",
  //   timestamp: "2026-05-07T10:00:00.000Z"
  // }
  
  showNotification(`${data.userName} joined the chat`);
});
```

#### User Left
```javascript
socket.on('user_left', (data) => {
  // data = {
  //   userId: "...",
  //   userName: "John Doe" or "STU-001",
  //   role: "student",
  //   timestamp: "2026-05-07T10:00:00.000Z"
  // }
  
  showNotification(`${data.userName} left the chat`);
});
```

#### User Typing
```javascript
socket.on('user_typing', (data) => {
  // data = {
  //   userId: "...",
  //   userName: "John Doe" or "STU-001",
  //   role: "student",
  //   isTyping: true
  // }
  
  if (data.isTyping) {
    showTypingIndicator(data.userName);
  } else {
    hideTypingIndicator(data.userName);
  }
});
```

---

## 🗄️ Database Schema

### GroupMessage Model
```javascript
{
  senderId: ObjectId,              // User who sent message
  senderRole: String,              // 'admin', 'teacher', 'student'
  senderName: String,              // Full name
  senderStudentId: String,         // Student ID
  message: String,                 // Message content (max 2000 chars)
  
  // Deletion tracking
  isDeleted: Boolean,              // Soft delete flag
  deletedAt: Date,                 // When deleted
  deletedBy: ObjectId,             // Who deleted
  deletedByRole: String,           // Role of deleter
  
  // Edit tracking (future)
  isEdited: Boolean,
  editedAt: Date,
  originalMessage: String,
  
  // Metadata
  readBy: [{                       // Who read the message
    userId: ObjectId,
    readAt: Date
  }],
  replyTo: ObjectId,               // Reply to message (future)
  attachments: [],                 // File attachments (future)
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 Frontend Implementation

### React Component Example

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';

const GroupChat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connect to Socket.io
    socketRef.current = io(process.env.REACT_APP_API_URL);

    // Join group chat
    socketRef.current.emit('join_group_chat', {
      userId: user._id,
      userName: user.name,
      role: user.role,
      studentId: user.studentId
    });

    // Listen for new messages
    socketRef.current.on('new_group_message', (data) => {
      setMessages(prev => [...prev, data]);
      scrollToBottom();
    });

    // Listen for deleted messages
    socketRef.current.on('message_deleted', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.messageId === data.messageId 
          ? { ...msg, message: '[Message deleted]', isDeleted: true }
          : msg
      ));
    });

    // Listen for typing
    socketRef.current.on('user_typing', (data) => {
      if (data.userId !== user._id) {
        if (data.isTyping) {
          setTypingUsers(prev => [...prev, data.userName]);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== data.userName));
        }
      }
    });

    // Load initial messages
    loadMessages();

    return () => {
      socketRef.current.emit('leave_group_chat');
      socketRef.current.disconnect();
    };
  }, []);

  const loadMessages = async () => {
    try {
      const response = await api.get('/group-chat/messages?limit=100');
      setMessages(response.data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      await api.post('/group-chat/messages', { message: newMessage });
      setNewMessage('');
      setIsTyping(false);
      socketRef.current.emit('typing', { isTyping: false });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { isTyping: true });
    }

    // Clear typing after 3 seconds
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('typing', { isTyping: false });
    }, 3000);
  };

  const deleteMessage = async (messageId) => {
    if (!['admin', 'teacher'].includes(user.role)) return;
    
    try {
      await api.delete(`/group-chat/messages/${messageId}`);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageColor = (role) => {
    switch(role) {
      case 'admin': return '#22c55e'; // green
      case 'teacher': return '#ef4444'; // red
      default: return 'inherit'; // theme-based
    }
  };

  return (
    <div className="group-chat">
      <div className="chat-header">
        <h2>Group Chat</h2>
        <span>{messages.length} messages</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div 
            key={msg._id} 
            className={`message ${msg.senderRole}`}
            style={{ borderLeftColor: getMessageColor(msg.senderRole) }}
          >
            <div className="message-header">
              <span className="sender-name" style={{ color: getMessageColor(msg.senderRole) }}>
                {msg.senderName}
              </span>
              <span className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="message-content">
              {msg.isDeleted ? (
                <em style={{ opacity: 0.5 }}>[Message deleted]</em>
              ) : (
                msg.message
              )}
            </div>

            {['admin', 'teacher'].includes(user.role) && !msg.isDeleted && (
              <button 
                className="delete-btn"
                onClick={() => deleteMessage(msg._id)}
              >
                Delete
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <form className="chat-input" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          maxLength={2000}
        />
        <button type="submit" disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default GroupChat;
```

### CSS Example
```css
.group-chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
}

.chat-header {
  padding: 1rem;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #ffffff;
}

.message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-left: 4px solid;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.message.admin {
  border-left-color: #22c55e;
}

.message.teacher {
  border-left-color: #ef4444;
}

.message.student {
  border-left-color: #6b7280;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.sender-name {
  font-weight: 600;
}

.message-time {
  color: #6b7280;
  font-size: 0.75rem;
}

.message-content {
  color: #1f2937;
  word-wrap: break-word;
}

.delete-btn {
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #ef4444;
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 0.25rem;
  cursor: pointer;
}

.typing-indicator {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

.chat-input {
  display: flex;
  padding: 1rem;
  background: #f3f4f6;
  border-top: 1px solid #e5e7eb;
}

.chat-input input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  margin-right: 0.5rem;
}

.chat-input button {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  .chat-messages {
    background: #1f2937;
  }
  
  .message {
    background: #374151;
  }
  
  .message-content {
    color: #f3f4f6;
  }
}
```

---

## 🔐 Permission Matrix

| Action | Admin | Teacher | Student |
|--------|-------|---------|---------|
| Send Message | ✅ | ✅ | ✅ |
| View Messages | ✅ | ✅ | ✅ |
| See Full Names | ✅ | ✅ | ❌ (only IDs) |
| Delete Messages | ✅ | ✅ | ❌ |
| View Deleted | ✅ | ❌ | ❌ |
| View Statistics | ✅ | ❌ | ❌ |
| Track Users | ✅ | ❌ | ❌ |

---

## 📊 Admin Dashboard Features

### Chat Statistics
- Total messages sent
- Active vs deleted messages
- Deletion rate
- Messages by role breakdown
- Most active users

### Moderation Tools
- Delete any message
- View deleted messages with full history
- Track who deleted what and when
- View messages by specific user
- Export chat logs

### Monitoring
- Real-time message feed
- User activity tracking
- Inappropriate content detection (future)
- Automated moderation rules (future)

---

## 🧪 Testing

### Test Send Message
```bash
curl -X POST http://localhost:5000/api/group-chat/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello everyone!"}'
```

### Test Get Messages
```bash
curl http://localhost:5000/api/group-chat/messages?page=1&limit=50 \
  -H "Authorization: Bearer <token>"
```

### Test Delete Message
```bash
curl -X DELETE http://localhost:5000/api/group-chat/messages/<message_id> \
  -H "Authorization: Bearer <admin_token>"
```

### Test Statistics
```bash
curl http://localhost:5000/api/group-chat/stats \
  -H "Authorization: Bearer <admin_token>"
```

---

## 🔮 Future Enhancements

Potential improvements:
1. Message reactions (emoji)
2. Message editing
3. Reply to specific messages
4. File/image attachments
5. Message search
6. Export chat history
7. Automated moderation (profanity filter)
8. Message pinning
9. Announcements (admin only)
10. Read receipts
11. Message formatting (bold, italic)
12. Mentions (@username)

---

**Version**: 1.0.0  
**Date**: 2026-05-07  
**Status**: ✅ Ready for Testing
