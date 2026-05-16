/**
 * Group Chat Controller
 * Handles group chat messages, deletion tracking, and admin monitoring
 */

const GroupMessage = require('../models/GroupMessage');
const logActivity = require('../middleware/activityLogger');
const logger = require('../utils/logger');
const { getIO } = require('../socket');

// POST /api/group-chat/messages - Send message to group chat
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    // Validate message length
    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message too long. Maximum 2000 characters.' });
    }

    // Create message
    const groupMessage = await GroupMessage.create({
      senderId: req.user._id,
      senderRole: req.user.role,
      senderName: req.user.name,
      senderStudentId: req.user.studentId,
      message: message.trim()
    });

    // Log activity
    await logActivity(
      req.user._id,
      'group_chat_message',
      null,
      `Sent message in group chat`
    );

    // Broadcast to all connected users via Socket.io
    const io = getIO();
    if (io) {
      // Send different views based on role
      io.to('group_chat').emit('new_group_message', {
        messageId: groupMessage._id,
        senderId: groupMessage.senderId,
        senderRole: groupMessage.senderRole,
        senderStudentId: groupMessage.senderStudentId,
        senderName: groupMessage.senderName,
        message: groupMessage.message,
        messageColor: groupMessage.messageColor,
        createdAt: groupMessage.createdAt
      });
    }

    logger.info(`Group message sent by ${req.user.studentId} (${req.user.role})`);

    res.status(201).json({
      message: 'Message sent successfully',
      data: req.user.role === 'student' 
        ? groupMessage.toStudentView() 
        : groupMessage.toAdminView()
    });
  } catch (error) {
    logger.error('Send group message error:', error);
    res.status(500).json({ message: 'Server error sending message.' });
  }
};

// GET /api/group-chat/messages - Get group chat messages
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50, includeDeleted = false } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    // Only admin/teacher can see deleted messages
    if (req.user.role === 'student' || includeDeleted === 'false') {
      query.isDeleted = false;
    }

    const total = await GroupMessage.countDocuments(query);
    
    const messages = await GroupMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Format messages based on user role
    const formattedMessages = messages.map(msg => {
      if (req.user.role === 'student') {
        // Students see limited info
        return {
          _id: msg._id,
          senderId: msg.senderId,
          senderRole: msg.senderRole,
          senderStudentId: msg.senderStudentId,
          // Students only see ID for other students, name for admin/teacher
          senderName: msg.senderRole === 'student' ? msg.senderStudentId : msg.senderName,
          message: msg.isDeleted ? '[Message deleted]' : msg.message,
          isDeleted: msg.isDeleted,
          isEdited: msg.isEdited,
          messageColor: msg.senderRole === 'admin' ? 'green' : msg.senderRole === 'teacher' ? 'red' : 'default',
          createdAt: msg.createdAt
        };
      } else {
        // Admin/Teacher see full details
        return {
          _id: msg._id,
          senderId: msg.senderId,
          senderRole: msg.senderRole,
          senderStudentId: msg.senderStudentId,
          senderName: msg.senderName,
          message: msg.isDeleted ? '[Message deleted]' : msg.message,
          isDeleted: msg.isDeleted,
          deletedAt: msg.deletedAt,
          deletedBy: msg.deletedBy,
          deletedByRole: msg.deletedByRole,
          isEdited: msg.isEdited,
          editedAt: msg.editedAt,
          originalMessage: msg.originalMessage,
          messageColor: msg.senderRole === 'admin' ? 'green' : msg.senderRole === 'teacher' ? 'red' : 'default',
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt
        };
      }
    });

    res.json({
      messages: formattedMessages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get group messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages.' });
  }
};

// DELETE /api/group-chat/messages/:id - Delete message (Admin/Teacher only)
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin and teacher can delete messages
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Students cannot delete messages.' });
    }

    const message = await GroupMessage.findById(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: 'Message already deleted.' });
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user._id;
    message.deletedByRole = req.user.role;
    await message.save();

    // Log activity
    await logActivity(
      req.user._id,
      'group_chat_delete_message',
      null,
      `Deleted message from ${message.senderName} (${message.senderStudentId})`
    );

    // Notify all users via Socket.io
    const io = getIO();
    if (io) {
      io.to('group_chat').emit('message_deleted', {
        messageId: message._id,
        deletedBy: req.user.name,
        deletedByRole: req.user.role
      });
    }

    logger.info(`Message ${id} deleted by ${req.user.studentId} (${req.user.role})`);

    res.json({
      message: 'Message deleted successfully',
      data: message.toAdminView()
    });
  } catch (error) {
    logger.error('Delete group message error:', error);
    res.status(500).json({ message: 'Server error deleting message.' });
  }
};

// GET /api/group-chat/stats - Get chat statistics (Admin only)
const getChatStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const totalMessages = await GroupMessage.countDocuments();
    const deletedMessages = await GroupMessage.countDocuments({ isDeleted: true });
    const activeMessages = totalMessages - deletedMessages;

    // Messages by role
    const messagesByRole = await GroupMessage.aggregate([
      {
        $group: {
          _id: '$senderRole',
          count: { $sum: 1 }
        }
      }
    ]);

    // Most active users
    const mostActiveUsers = await GroupMessage.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 },
          senderName: { $first: '$senderName' },
          senderStudentId: { $first: '$senderStudentId' },
          senderRole: { $first: '$senderRole' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Recent deletions
    const recentDeletions = await GroupMessage.find({ isDeleted: true })
      .sort({ deletedAt: -1 })
      .limit(10)
      .populate('deletedBy', 'name studentId role')
      .lean();

    res.json({
      stats: {
        totalMessages,
        activeMessages,
        deletedMessages,
        deletionRate: totalMessages > 0 ? ((deletedMessages / totalMessages) * 100).toFixed(2) + '%' : '0%'
      },
      messagesByRole: messagesByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      mostActiveUsers: mostActiveUsers.map(user => ({
        userId: user._id,
        name: user.senderName,
        studentId: user.senderStudentId,
        role: user.senderRole,
        messageCount: user.count
      })),
      recentDeletions: recentDeletions.map(msg => ({
        messageId: msg._id,
        sender: msg.senderName,
        senderId: msg.senderStudentId,
        message: msg.message.substring(0, 50) + '...',
        deletedBy: msg.deletedBy?.name,
        deletedByRole: msg.deletedByRole,
        deletedAt: msg.deletedAt
      }))
    });
  } catch (error) {
    logger.error('Get chat stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats.' });
  }
};

// GET /api/group-chat/deleted - Get deleted messages (Admin only)
const getDeletedMessages = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const total = await GroupMessage.countDocuments({ isDeleted: true });
    
    const deletedMessages = await GroupMessage.find({ isDeleted: true })
      .populate('deletedBy', 'name studentId role')
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      messages: deletedMessages.map(msg => ({
        _id: msg._id,
        sender: {
          name: msg.senderName,
          studentId: msg.senderStudentId,
          role: msg.senderRole
        },
        message: msg.message,
        deletedBy: {
          name: msg.deletedBy?.name,
          studentId: msg.deletedBy?.studentId,
          role: msg.deletedByRole
        },
        deletedAt: msg.deletedAt,
        createdAt: msg.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get deleted messages error:', error);
    res.status(500).json({ message: 'Server error fetching deleted messages.' });
  }
};

// GET /api/group-chat/user/:userId - Get messages by specific user (Admin only)
const getUserMessages = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { userId } = req.params;
    const { page = 1, limit = 50, includeDeleted = true } = req.query;
    const skip = (page - 1) * limit;

    const query = { senderId: userId };
    if (includeDeleted === 'false') {
      query.isDeleted = false;
    }

    const total = await GroupMessage.countDocuments(query);
    
    const messages = await GroupMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      messages: messages.map(msg => msg),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get user messages error:', error);
    res.status(500).json({ message: 'Server error fetching user messages.' });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  deleteMessage,
  getChatStats,
  getDeletedMessages,
  getUserMessages
};
