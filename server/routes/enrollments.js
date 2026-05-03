const express = require('express');
const router = express.Router();
const { enrollStudents, getEnrollments, removeEnrollment } = require('../controllers/enrollmentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(auth);

router.post('/', authorize('admin'), enrollStudents);
router.get('/:classId', authorize('admin'), getEnrollments);
router.delete('/:id', authorize('admin'), removeEnrollment);

module.exports = router;
