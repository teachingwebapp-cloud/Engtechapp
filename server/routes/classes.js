const express = require('express');
const router = express.Router();
const { createClass, getClasses, getClass, updateClass, joinClass, leaveClass, deleteClass } = require('../controllers/classController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

// All routes require authentication
router.use(auth);

router.post('/', authorize('admin'), createClass);
router.get('/', authorize('admin', 'student'), getClasses);
router.get('/:id', authorize('admin', 'student'), getClass);
router.patch('/:id', authorize('admin'), updateClass);
router.delete('/:id', authorize('admin'), deleteClass);
router.get('/:id/join', authorize('admin', 'student'), joinClass);
router.post('/:id/leave', authorize('admin', 'student'), leaveClass);

module.exports = router;
