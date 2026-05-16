const express = require('express');
const router = express.Router();
const { createClass, getClasses, getClass, updateClass, joinClass, leaveClass, deleteClass } = require('../controllers/classController');
const {
  goLive,
  endLive,
  getLiveClasses,
  getLiveStatus
} = require('../controllers/liveClassController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validations = require('../middleware/validation');

// All routes require authentication
router.use(auth);

// Live class routes
router.get('/live', authorize('admin', 'teacher'), getLiveClasses);
router.post('/:id/go-live', authorize('admin', 'teacher'), validations.mongoId, goLive);
router.post('/:id/end-live', authorize('admin', 'teacher'), validations.mongoId, endLive);
router.get('/:id/live-status', validations.mongoId, getLiveStatus);

// Regular class routes
router.post('/', authorize('admin', 'teacher'), validations.createClass, createClass);
router.get('/', authorize('admin', 'teacher', 'student'), validations.pagination, getClasses);
router.get('/:id', authorize('admin', 'teacher', 'student'), validations.mongoId, getClass);
router.patch('/:id', authorize('admin', 'teacher'), validations.updateClass, updateClass);
router.delete('/:id', authorize('admin', 'teacher'), validations.mongoId, deleteClass);
router.get('/:id/join', authorize('admin', 'teacher', 'student'), validations.mongoId, joinClass);
router.post('/:id/leave', authorize('admin', 'teacher', 'student'), validations.mongoId, leaveClass);

module.exports = router;
