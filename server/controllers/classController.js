const mongoose = require('mongoose');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { generateRoomName, getJitsiConfig } = require('../utils/jitsiConfig');
const logActivity = require('../middleware/activityLogger');
const logger = require('../utils/logger');
const { getIO } = require('../socket');
const { 
  checkScheduleConflict, 
  notifyScheduleConflict 
} = require('../utils/scheduleConflictDetector');

// POST /api/classes — Create class (Teacher/Admin)
const createClass = async (req, res) => {
  try {
    const { title, schedule, duration, description } = req.body;

    if (!title || !title.trim() || !schedule) {
      return res.status(400).json({ message: 'Title and schedule are required.' });
    }

    // Check if user can create classes
    if (req.user.role === 'teacher' || (req.user.role === 'admin' && req.user.canTeach)) {
      // Allowed
    } else if (req.user.role === 'admin' && req.user.studentId === 'admin') {
      // Super admin allowed
    } else {
      return res.status(403).json({ message: 'You do not have permission to create classes.' });
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

    // Check for schedule conflicts
    const conflictCheck = await checkScheduleConflict(scheduleDate, dur);
    
    const jitsiRoomName = generateRoomName(title.trim());

    const newClass = await Class.create({
      title: title.trim(),
      teacherId: req.user._id,
      schedule: scheduleDate,
      duration: dur,
      jitsiRoomName,
      description: description || '',
      status: 'scheduled',
      hasConflict: conflictCheck.hasConflict
    });

    // Notify about conflicts if any
    if (conflictCheck.hasConflict) {
      await notifyScheduleConflict(
        req.user._id,
        {
          title: title.trim(),
          schedule: scheduleDate,
          teacherName: req.user.name
        },
        conflictCheck.conflictingClasses
      );
    }

    await logActivity(req.user._id, 'create_class', newClass._id, `Created class: ${title.trim()}`);

    logger.info(`Class created: ${title.trim()} by ${req.user.studentId} at ${scheduleDate}`);

    res.status(201).json({
      message: 'Class created successfully.',
      class: newClass,
      ...(conflictCheck.hasConflict && {
        warning: `${conflictCheck.conflictCount} other class(es) scheduled at this time`,
        conflicts: conflictCheck.conflictingClasses.map(c => ({
          id: c._id,
          title: c.title,
          teacher: c.teacherId?.name,
          schedule: c.schedule
        }))
      })
    });
  } catch (error) {
    logger.error('Create class error:', error);
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

    // Role-based filtering
    if (req.user.role === 'teacher') {
      // Teachers see only their own classes
      filter.teacherId = req.user._id;
    } else if (req.user.role === 'admin' && req.user.isAdminTeacher) {
      // Admin-Teachers see their own classes
      filter.teacherId = req.user._id;
    } else if (req.user.role === 'admin' && req.user.studentId === 'admin') {
      // Super-Admin sees all classes
      // No filter needed
    } else if (req.user.role === 'student') {
      // Only return classes the student is enrolled in
      const enrollments = await Enrollment.find({ studentId: req.user._id });
      logger.debug(`Enrollments for student ${req.user._id}: ${enrollments.length}`);
      const classIds = enrollments.map(e => e.classId);
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
    logger.error('Get classes error:', error);
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
    if ((req.user.role === 'teacher' || req.user.isAdminTeacher) && 
        req.user.studentId !== 'admin' &&
        classItem.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only view your own classes.' });
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

    if ((req.user.role === 'teacher' || req.user.isAdminTeacher) &&
        classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only update your own classes.' });
    }

    // Teacher can have only one live class at a time.
    if (status === 'live' && (req.user.role === 'teacher' || req.user.isAdminTeacher)) {
      const otherLive = await Class.findOne({
        teacherId: req.user._id,
        status: 'live',
        _id: { $ne: classItem._id }
      });
      if (otherLive) {
        return res.status(400).json({ message: 'You already have a live class. End it before starting another.' });
      }
    }

    // Check for schedule conflicts if schedule is being updated
    if (schedule) {
      const scheduleDate = new Date(schedule);
      // Validate schedule is in the future (only for future updates)
      if (scheduleDate < new Date() && classItem.status === 'scheduled') {
        return res.status(400).json({ message: 'Class schedule must be in the future.' });
      }
      
      // Check conflicts with other teachers
      const dur = duration || classItem.duration;
      const conflicts = await checkScheduleConflict(req.user._id, scheduleDate, dur, classItem._id);
      
      if (conflicts.length > 0) {
        logger.warn(`Schedule conflict detected when updating class ${classItem._id}`);
        
        // Notify about conflicts
        const io = getIO();
        if (io) {
          io.to(`user_${req.user._id}`).emit('schedule_conflict', {
            message: `⚠️ ${conflicts.length} other teacher(s) have classes scheduled at this time`,
            conflicts: conflicts.map(c => ({
              title: c.title,
              teacher: c.teacherId.name,
              schedule: c.schedule
            }))
          });
        }
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
    } else if ((req.user.role === 'teacher' || req.user.isAdminTeacher) &&
               classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only join your own classes.' });
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

// DELETE /api/classes/:id — Delete class (Admin only)
const deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // Super Admin can delete any class; Teachers can only delete their own
    if (
      (req.user.role === 'teacher' || req.user.isAdminTeacher) &&
      req.user.studentId !== 'admin' &&
      classItem.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own classes.' });
    }

    // Remove all enrollments for this class first
    await Enrollment.deleteMany({ classId: classItem._id });

    await Class.findByIdAndDelete(req.params.id);

    await logActivity(req.user._id, 'delete_class', classItem._id, `Deleted class: ${classItem.title}`);

    logger.info(`Class deleted: ${classItem.title} by ${req.user.studentId}`);

    res.json({ message: 'Class deleted successfully.' });
  } catch (error) {
    logger.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error deleting class.' });
  }
};

module.exports = { createClass, getClasses, getClass, updateClass, joinClass, leaveClass, deleteClass };
