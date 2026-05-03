const { Server } = require('socket.io');

let _io = null;

/**
 * Returns the Socket.IO instance (usable from controllers).
 */
const getIO = () => _io;

const setupSocket = (server) => {
  _io = new Server(server, {
    cors: {
      origin: '*', // Handled globally by Helmet/Express but wildcarded for websockets fallback
      methods: ['GET', 'POST']
    }
  });

  _io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

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

        console.log(`User ${userName} joined class ${classId} as ${role}`);
      } catch (error) {
        console.error('Error in join_class:', error);
        socket.emit('error', { message: 'Failed to join class' });
      }
    });

    // Handle student sending a message -> ONLY routed to teachers
    socket.on('student_send_message', (data) => {
      try {
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
        console.error('Error in student_send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle teacher sending a message -> To all or specific student
    socket.on('teacher_send_message', (data) => {
      try {
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
        console.error('Error in teacher_send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return _io;
};

module.exports = { setupSocket, getIO };
