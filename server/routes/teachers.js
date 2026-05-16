const express = require('express');
const router = express.Router();
const {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  toggleTeacherStatus,
  toggleAdminTeaching
} = require('../controllers/teacherController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validations = require('../middleware/validation');

// All routes require authentication
router.use(auth);

// Admin-only routes for teacher management
router.post('/', authorize('admin'), validations.createUser, createTeacher);
router.get('/', authorize('admin'), validations.pagination, getTeachers);
router.get('/:id', authorize('admin'), validations.mongoId, getTeacher);
router.patch('/:id', authorize('admin'), validations.mongoId, updateTeacher);
router.delete('/:id', authorize('admin'), validations.mongoId, deleteTeacher);
router.patch('/:id/toggle-status', authorize('admin'), validations.mongoId, toggleTeacherStatus);

// Admin toggle teaching ability
router.patch('/admin/toggle-teaching', authorize('admin'), toggleAdminTeaching);

module.exports = router;
