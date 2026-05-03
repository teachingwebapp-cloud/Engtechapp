const mongoose = require('mongoose');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const { generateRoomName, getJitsiConfig } = require('../utils/jitsiConfig');
const logActivity = require('../middleware/activityLogger');
const { getIO } = require('../socket');

// POST /api/classes — Create class (Teacher/Admin)
const createClass = async (req, res) => {
  try {
    const { title, schedule, duration, description } = req.body;

    if (!title || !title.trim() || !schedule) {
      return res.status(400).json({ message: 'Title and schedule are required.' });
    }

    // Validate schedule is in the future
    const scheduleDate = new Date(schedule);
    if (scheduleDate < new Date()) {
      return res.status(400).json({ message: 'Class schedule must be in the future.' });
    }

    // Validate duration
    const dur = duration || 60;
    if (dur < 15 || dur > 300) {
      return res.status(400).json({ message: 'Duration must be between 15 and 300 minutes.' });
    }

    const jitsiRoomName = generateRoomName(title.trim());

    const newClass = await Class.create({
      title: title.trim(),
      teacherId: req.user._id,
      schedule: scheduleDate,
      duration: dur,
      jitsiRoomName,
      description: description || '',
      status: 'scheduled'
    });

    await logActivity(req.user._id, 'create_class', newClass._id, `Created class: ${title.trim()}`);

    res.status(201).json({
      message: 'Class created successfully.',
      class: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: 'Server error creating class.' });
  }
};

// GET /api/classes — List classes (role-filtered)
const getClasses = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let filter = {};

    // --- Development Mock (if DB is disconnected) ---
    if (process.env.NODE_ENV === 'development' && mongoose.connection.readyState === 0) {
      const mockClasses = [
        {
          _id: '607f1f77bcf86cd799439011',
          title: 'Introduction to Spoken English',
          teacherId: { name: 'Platform Admin', studentId: 'TEACH-001' },
          schedule: new Date(Date.now() + 3600000).toISOString(),
          status: 'scheduled',
          description: 'A beginner level class to get started with basic english communication.'
        },
        {
          _id: '607f1f77bcf86cd799439012',
          title: 'Intermediate Grammar Workshop',
          teacherId: { name: 'Platform Admin', studentId: 'TEACH-001' },
          schedule: new Date(Date.now() + 86400000).toISOString(),
          status: 'scheduled',
          description: 'Master complex grammar structures and improve sentence construction.'
        }
      ];
      return res.json({
        classes: mockClasses,
        pagination: { page: 1, limit: 20, total: 2, pages: 1 }
      });
    }
    // -------------------------------------------------

    if (req.user.role === 'admin') {
      filter.teacherId = req.user._id;
    } else if (req.user.role === 'student') {
      // Only return classes the student is enrolled in
      const enrollments = await Enrollment.find({ studentId: req.user._id });
      console.log('DEBUG: enrollments for student', req.user._id, '->', enrollments);
      const classIds = enrollments.map(e => e.classId);
      console.log('DEBUG: matched classIds ->', classIds);
      filter._id = { $in: classIds };
    }

    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Class.countDocuments(filter);
    const classes = await Class.find(filter)
      .populate('teacherId', 'name studentId')
      .sort({ schedule: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Fix #7: Only hide jitsiRoomName from students (not from admins who need it to manage their classes)
    const formattedClasses = classes.map(c => {
      const classObj = c.toObject();
      if (req.user.role === 'student') {
        delete classObj.jitsiRoomName;
      }
      return classObj;
    });

    res.json({
      classes: formattedClasses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error fetching classes.' });
  }
};

// GET /api/classes/:id — Get single class
const getClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('teacherId', 'name studentId');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // Student: must be enrolled
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({
        studentId: req.user._id,
        classId: classItem._id
      });
      if (!enrollment) {
        return res.status(403).json({ message: 'Not enrolled in this class.' });
      }
    }

    // Ownership check (Teachers only manage their own classes, Super Admin bypasses)
    if (req.user.role === 'admin' && req.user.studentId !== 'admin' &&
        classItem.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only update your own classes.' });
    }

    res.json({ class: classItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching class.' });
  }
};

// PATCH /api/classes/:id — Update class (Teacher/Admin)
const updateClass = async (req, res) => {
  try {
    const { title, schedule, duration, description, status } = req.body;
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    if (req.user.role === 'admin' &&
        classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Teacher can have only one live class at a time.
    if (status === 'live' && req.user.role === 'admin') {
      const otherLive = await Class.findOne({
        teacherId: req.user._id,
        status: 'live',
        _id: { $ne: classItem._id }
      });
      if (otherLive) {
        return res.status(400).json({ message: 'You already have a live class. End it before starting another.' });
      }
    }

    if (title) classItem.title = title;
    if (schedule) {
      const scheduleDate = new Date(schedule);
      // Validate schedule is in the future (only for future updates)
      if (scheduleDate < new Date() && classItem.status === 'scheduled') {
        return res.status(400).json({ message: 'Class schedule must be in the future.' });
      }
      classItem.schedule = scheduleDate;
    }
    if (duration) {
      if (duration < 15 || duration > 300) {
        return res.status(400).json({ message: 'Duration must be between 15 and 300 minutes.' });
      }
      classItem.duration = duration;
    }
    if (description !== undefined) classItem.description = description;
    if (status) classItem.status = status;

    await classItem.save();
    await logActivity(req.user._id, 'update_class', classItem._id, `Updated class: ${classItem.title}`);

    // Feature #16: Emit real-time event when a class goes live or ends
    // so students and the teacher dashboard get instant updates without polling
    const io = getIO();
    if (io && status === 'live') {
      io.emit('class_live', {
        classId: classItem._id.toString(),
        title: classItem.title,
        teacherName: req.user.name
      });
    } else if (io && status === 'completed') {
      io.emit('class_ended', {
        classId: classItem._id.toString(),
        title: classItem.title
      });
    }

    res.json({ message: 'Class updated successfully.', class: classItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating class.' });
  }
};

// GET /api/classes/:id/join — Get Jitsi config for joining (enrolled students & teacher)
const joinClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // Verify access
    let sessionId = null;
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({
        studentId: req.user._id,
        classId: classItem._id
      });
      if (!enrollment) {
        return res.status(403).json({ message: 'Not enrolled in this class.' });
      }

      // Students may only join when the class is live.
      if (classItem.status !== 'live') {
        return res.status(403).json({ message: 'Class is not live yet.' });
      }

      // Generate unique session ID for tracking this student's session
      sessionId = `${classItem._id}-${req.user._id}-${Date.now()}`;
    } else if (req.user.role === 'admin' &&
               classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const jitsiConfig = getJitsiConfig(req.user.role, req.user.name, classItem.jitsiRoomName);

    // Log join activity with session tracking
    await logActivity(req.user._id, 'class_join', classItem._id,
      `Joined class: ${classItem.title}${sessionId ? ` [Session: ${sessionId}]` : ''}`);

    res.json({
      jitsiConfig,
      classTitle: classItem.title,
      roomName: classItem.jitsiRoomName,
      sessionId // Return sessionId so frontend can track this session
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error joining class.' });
  }
};

// POST /api/classes/:id/leave — Log when student leaves/exits class
const leaveClass = async (req, res) => {
  try {
    const { sessionId, durationSeconds } = req.body;
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    const durationMinutes = Math.round(durationSeconds / 60) || 0;
    const details = `Left class: ${classItem.title}${sessionId ? ` [Session: ${sessionId}]` : ''} (Duration: ${durationMinutes} minutes)`;

    // Log leave activity
    await logActivity(req.user._id, 'class_leave', classItem._id, details);

    res.json({ message: 'Exit logged successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error logging class exit.' });
  }
};

module.exports = { createClass, getClasses, getClass, updateClass, joinClass, leaveClass };
