const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Class = require('../models/Class');
const logActivity = require('../middleware/activityLogger');
const { getIO } = require('../socket');

// POST /api/enrollments — Enroll student(s) in a class
const enrollStudents = async (req, res) => {
  try {
    const { studentIds, classId } = req.body;

    if (!studentIds || !classId) {
      return res.status(400).json({ message: 'Student IDs and class ID are required.' });
    }

    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // Verify teacher owns this class
    if (req.user.role === 'admin' &&
        classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
    const results = [];
    const errors = [];

    for (const sid of ids) {
      try {
        const student = await User.findById(sid);
        if (!student || student.role !== 'student') {
          errors.push({ studentId: sid, error: 'Student not found' });
          continue;
        }

        const existing = await Enrollment.findOne({ studentId: sid, classId });
        if (existing) {
          errors.push({ studentId: sid, error: 'Already enrolled' });
          continue;
        }

        const enrollment = await Enrollment.create({ studentId: sid, classId });
        results.push(enrollment);
      } catch (err) {
        errors.push({ studentId: sid, error: err.message });
      }
    }

    await logActivity(req.user._id, 'enroll_students', classId,
      `Enrolled ${results.length} student(s) in class: ${classItem.title}`);

    // Emit real-time event to update student dashboards without refreshing
    const io = getIO();
    if (io && results.length > 0) {
      ids.forEach(sid => {
        io.emit(`enrollment_added_${sid}`, { classId: classItem._id.toString() });
      });
    }

    res.status(201).json({
      message: `${results.length} student(s) enrolled successfully.`,
      enrollments: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Enroll students error:', error);
    res.status(500).json({ message: 'Server error enrolling students.' });
  }
};

// GET /api/enrollments/:classId — List enrolled students (Teacher only)
const getEnrollments = async (req, res) => {
  try {
    const { classId } = req.params;

    // Students CANNOT see other enrollments
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    if (req.user.role === 'admin' &&
        classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const enrollments = await Enrollment.find({ classId })
      .populate('studentId', 'name studentId isActive')
      .populate('classId', 'title schedule');

    res.json({ enrollments });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching enrollments.' });
  }
};

// DELETE /api/enrollments/:id — Remove enrollment (Teacher only)
const removeEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('classId', 'title teacherId');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found.' });
    }

    if (req.user.role === 'admin' &&
        enrollment.classId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await Enrollment.findByIdAndDelete(req.params.id);

    await logActivity(req.user._id, 'remove_enrollment', enrollment.classId._id,
      'Removed student from class');

    const io = getIO();
    if (io) {
      io.emit(`enrollment_removed_${enrollment.studentId}`, { classId: enrollment.classId._id.toString() });
    }

    res.json({ message: 'Student removed from class successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error removing enrollment.' });
  }
};

module.exports = { enrollStudents, getEnrollments, removeEnrollment };
