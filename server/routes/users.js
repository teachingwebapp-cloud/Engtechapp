const express = require('express');
const router = express.Router();
const { createTeacher, createStudent, getUsers, getUser, toggleUserStatus, deleteUser } = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validations = require('../middleware/validation');

// All routes require authentication
router.use(auth);

// Teacher management (Admin only)
router.post('/teacher', authorize('admin'), validations.createUser, createTeacher);

// Student management (Admin and Teacher)
router.post('/', authorize('admin', 'teacher'), validations.createUser, createStudent);

// User listing and management
router.get('/', authorize('admin', 'teacher'), validations.pagination, getUsers);
router.get('/:id', authorize('admin', 'teacher'), validations.mongoId, getUser);
router.patch('/:id/status', authorize('admin', 'teacher'), validations.updateUserStatus, toggleUserStatus);
router.delete('/:id', authorize('admin'), validations.mongoId, deleteUser);

module.exports = router;
