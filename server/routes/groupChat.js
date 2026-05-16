const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  deleteMessage,
  getChatStats,
  getDeletedMessages,
  getUserMessages
} = require('../controllers/groupChatController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { body } = require('express-validator');
const validations = require('../middleware/validation');

// All routes require authentication
router.use(auth);

// Send message (All users)
router.post('/messages', 
  [
    body('message')
      .trim()
      .notEmpty().withMessage('Message is required')
      .isLength({ max: 2000 }).withMessage('Message too long (max 2000 characters)'),
    validations.validate
  ],
  sendMessage
);

// Get messages (All users)
router.get('/messages', validations.pagination, getMessages);

// Delete message (Admin/Teacher only)
router.delete('/messages/:id', authorize('admin', 'teacher'), validations.mongoId, deleteMessage);

// Get chat statistics (Admin only)
router.get('/stats', authorize('admin'), getChatStats);

// Get deleted messages (Admin only)
router.get('/deleted', authorize('admin'), validations.pagination, getDeletedMessages);

// Get messages by user (Admin only)
router.get('/user/:userId', authorize('admin'), validations.mongoId, getUserMessages);

module.exports = router;
