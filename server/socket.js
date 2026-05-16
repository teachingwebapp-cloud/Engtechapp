const { Server } = require('socket.io');
const logger = require('./utils/logger');
const socketRateLimiter = require('./middleware/socketRateLimit');

let _io = null;

/**
 * Returns the Socket.IO instance (usable from controllers).
 */
const getIO = () => _io;

const setupSocket = (server) => {
  _io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Use same CORS logic as Express
        if (process.env.NODE_ENV === 'development' || !origin) {
          return callback(null, true);
        }
        
        let configuredUrl = process.env.CLIENT_URL || '';
        if (configuredUrl.endsWith('/')) {
          configuredUrl = configuredUrl.slice(0, -1);
        }

        const allowed = [
          configuredUrl,
          'http://localhost:5173',
          'http://localhost:5174',
          'https://web-production-cced82.up.railway.app'
        ].filter(Boolean);

        if (allowed.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn(`Socket.io CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  _io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join group chat room (all users)
    socket.on('join_group_chat', ({ userId, userName, role, studentId }) => {
      try {
        // Store user info on socket
        socket.user = { userId, userName, role, studentId };
        
        // Join group chat room
        socket.join('group_chat');
        
        logger.info(`User ${userName} (${studentId}) joined group chat as ${role}`);
        
        // Notify others (optional)
        socket.to('group_chat').emit('user_joined', {
          userId,
          userName: role === 'student' ? studentId : userName,
          role,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error in join_group_chat:', error);
        socket.emit('error', { message: 'Failed to join group chat' });
      }
    });

    // Leave group chat
    socket.on('leave_group_chat', () => {
      try {
        if (socket.user) {
          socket.leave('group_chat');
          
          // Notify others (optional)
          socket.to('group_chat').emit('user_left', {
            userId: socket.user.userId,
            userName: socket.user.role === 'student' ? socket.user.studentId : socket.user.userName,
            role: socket.user.role,
            timestamp: new Date().toISOString()
          });
          
          logger.info(`User ${socket.user.userName} left group chat`);
        }
      } catch (error) {
        logger.error('Error in leave_group_chat:', error);
      }
    });

    // Typing indicator
    socket.on('typing', ({ isTyping }) => {
      try {
        if (socket.user) {
          socket.to('group_chat').emit('user_typing', {
            userId: socket.user.userId,
            userName: socket.user.role === 'student' ? socket.user.studentId : socket.user.userName,
            role: socket.user.role,
            isTyping
          });
        }
      } catch (error) {
        logger.error('Error in typing:', error);
      }
    });

    // Join room logic strictly by Role
    socket.on('join_class', ({ classId, role, studentId, userName }) => {
      try {
        // Store user info on the socket for reference
        socket.user = { classId, role, studentId, userName };

        // Everyone joins the main class room for global broadcasts from teachers
        socket.join(classId);

        if (role === 'admin') {
          // Teachers join a private room to receive student messages securely
          socket.join(`${classId}_teachers`);
        } else {
          // Students join a dedicated private room so teachers can DM them securely
          socket.join(`${classId}_student_${studentId}`);
        }

        logger.info(`User ${userName} joined class ${classId} as ${role}`);
      } catch (error) {
        logger.error('Error in join_class:', error);
        socket.emit('error', { message: 'Failed to join class' });
      }
    });

    // Handle student sending a message -> ONLY routed to teachers
    socket.on('student_send_message', (data) => {
      try {
        // Rate limiting: 10 messages per minute
        if (!socketRateLimiter.isAllowed(socket.id, 'student_send_message', 10, 60000)) {
          socket.emit('error', { message: 'Too many messages. Please slow down.' });
          return;
        }

        if (!socket.user || socket.user.role !== 'student') {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Validate and sanitize message
        if (!data || !data.text || typeof data.text !== 'string') {
          socket.emit('error', { message: 'Invalid message format' });
          return;
        }

        const sanitizedText = data.text.trim().substring(0, 1000); // Limit to 1000 chars
        if (!sanitizedText) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        const payload = {
          id: Date.now() + Math.random().toString(),
          senderId: socket.user.studentId,
          senderName: socket.user.userName,
          role: socket.user.role,
          text: sanitizedText,
          timestamp: new Date().toISOString()
        };

        // Emit to teachers ONLY
        _io.to(`${socket.user.classId}_teachers`).emit('receive_message', payload);

        // Echo back to the student who sent it so they see it in their own UI
        socket.emit('receive_message', payload);
      } catch (error) {
        logger.error('Error in student_send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle teacher sending a message -> To all or specific student
    socket.on('teacher_send_message', (data) => {
      try {
        // Rate limiting: 30 messages per minute for teachers
        if (!socketRateLimiter.isAllowed(socket.id, 'teacher_send_message', 30, 60000)) {
          socket.emit('error', { message: 'Too many messages. Please slow down.' });
          return;
        }

        if (!socket.user || socket.user.role !== 'admin') {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Validate and sanitize message
        if (!data || !data.text || typeof data.text !== 'string') {
          socket.emit('error', { message: 'Invalid message format' });
          return;
        }

        const sanitizedText = data.text.trim().substring(0, 1000); // Limit to 1000 chars
        if (!sanitizedText) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        const payload = {
          id: Date.now() + Math.random().toString(),
          senderId: socket.user.studentId,
          senderName: socket.user.userName,
          role: 'admin',
          text: sanitizedText,
          timestamp: new Date().toISOString(),
          targetStudentId: data.targetStudentId || 'all'
        };

        if (data.targetStudentId && data.targetStudentId !== 'all') {
          // Direct message to a specific student
          _io.to(`${socket.user.classId}_student_${data.targetStudentId}`).emit('receive_message', payload);
          // Also ensure all teachers see the outbound Direct Message
          _io.to(`${socket.user.classId}_teachers`).emit('receive_message', payload);
        } else {
          // Broadcast to entire class (everyone)
          _io.to(socket.user.classId).emit('receive_message', payload);
          // Echo to teachers directly just in case namespace overlaps
          _io.to(`${socket.user.classId}_teachers`).emit('receive_message', payload);
        }
      } catch (error) {
        logger.error('Error in teacher_send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      // Clear rate limiter entries for this socket
      socketRateLimiter.clear(socket.id);
    });
    
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  return _io;
};

module.exports = { setupSocket, getIO };
