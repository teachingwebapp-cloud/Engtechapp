const express = require('express');
const router = express.Router();
const { enrollStudents, getEnrollments, removeEnrollment } = require('../controllers/enrollmentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validations = require('../middleware/validation');

router.use(auth);

router.post('/', authorize('admin', 'teacher'), validations.createEnrollment, enrollStudents);
router.get('/:classId', authorize('admin', 'teacher'), validations.mongoId, getEnrollments);
router.delete('/:id', authorize('admin', 'teacher'), validations.mongoId, removeEnrollment);

module.exports = router;
