/**
 * Live Class Controller
 * Handles going live, ending live classes, and live class management
 */

const Class = require('../models/Class');
const logActivity = require('../middleware/activityLogger');
const logger = require('../utils/logger');
const { getIO } = require('../socket');

// POST /api/classes/:id/go-live - Teacher starts a live class
const goLive = async (req, res) => {
  try {
    const { id } = req.params;

    const classItem = await Class.findById(id).populate('teacherId', 'name studentId');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // Check ownership
    if (classItem.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only start your own classes.' });
    }

    // Check if class is scheduled
    if (classItem.status !== 'scheduled') {
      return res.status(400).json({ 
        message: `Cannot go live. Class status is: ${classItem.status}` 
      });
    }

    // Check if teacher already has another live class
    const existingLiveClass = await Class.findOne({
      teacherId: req.user._id,
      status: 'live',
      _id: { $ne: id }
    });

    if (existingLiveClass) {
      return res.status(400).json({
        message: 'You already have a live class. Please end it before starting another.',
        liveClass: {
          id: existingLiveClass._id,
          title: existingLiveClass.title
        }
      });
    }

    // Update class to live
    classItem.status = 'live';
    classItem.isLive = true;
    classItem.liveStartedAt = new Date();
    await classItem.save();

    await logActivity(
      req.user._id,
      'class_go_live',
      classItem._id,
      `Started live class: ${classItem.title}`
    );

    // Notify all enrolled students
    const io = getIO();
    if (io) {
      io.emit('class_live', {
        classId: classItem._id.toString(),
        title: classItem.title,
        teacher: classItem.teacherId.name,
        teacherId: classItem.teacherId.studentId,
        startedAt: classItem.liveStartedAt
      });
    }

    logger.info(`Class went live: ${classItem.title} by ${req.user.studentId}`);

    res.json({
      message: 'Class is now live!',
      class: classItem
    });
  } catch (error) {
    logger.error('Go live error:', error);
    res.status(500).json({ message: 'Server error starting live class.' });
  }
};

// POST /api/classes/:id/end-live - Teacher ends a live class
const endLive = async (req, res) => {
  try {
    const { id } = req.params;

    const classItem = await Class.findById(id).populate('teacherId', 'name studentId');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // Check ownership
    if (classItem.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only end your own classes.' });
    }

    // Check if class is live
    if (classItem.status !== 'live') {
      return res.status(400).json({ 
        message: `Cannot end class. Class status is: ${classItem.status}` 
      });
    }

    // Update class to completed
    classItem.status = 'completed';
    classItem.isLive = false;
    classItem.liveEndedAt = new Date();
    await classItem.save();

    await logActivity(
      req.user._id,
      'class_end_live',
      classItem._id,
      `Ended live class: ${classItem.title}`
    );

    // Notify all participants
    const io = getIO();
    if (io) {
      io.emit('class_ended', {
        classId: classItem._id.toString(),
        title: classItem.title,
        teacher: classItem.teacherId.name,
        endedAt: classItem.liveEndedAt
      });
    }

    logger.info(`Class ended: ${classItem.title} by ${req.user.studentId}`);

    res.json({
      message: 'Class ended successfully.',
      class: classItem,
      duration: classItem.liveStartedAt 
        ? Math.round((classItem.liveEndedAt - classItem.liveStartedAt) / 60000) 
        : null
    });
  } catch (error) {
    logger.error('End live error:', error);
    res.status(500).json({ message: 'Server error ending live class.' });
  }
};

// GET /api/classes/live - Get all currently live classes
const getLiveClasses = async (req, res) => {
  try {
    const liveClasses = await Class.find({ status: 'live', isLive: true })
      .populate('teacherId', 'name studentId email')
      .select('title schedule duration teacherId liveStartedAt')
      .sort({ liveStartedAt: -1 })
      .lean();

    res.json({
      liveClasses,
      count: liveClasses.length
    });
  } catch (error) {
    logger.error('Get live classes error:', error);
    res.status(500).json({ message: 'Server error fetching live classes.' });
  }
};

// GET /api/classes/:id/live-status - Check if class is live
const getLiveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const classItem = await Class.findById(id)
      .select('status isLive liveStartedAt liveEndedAt')
      .lean();

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    res.json({
      classId: id,
      isLive: classItem.isLive,
      status: classItem.status,
      liveStartedAt: classItem.liveStartedAt,
      liveEndedAt: classItem.liveEndedAt,
      duration: classItem.liveStartedAt && classItem.liveEndedAt
        ? Math.round((new Date(classItem.liveEndedAt) - new Date(classItem.liveStartedAt)) / 60000)
        : null
    });
  } catch (error) {
    logger.error('Get live status error:', error);
    res.status(500).json({ message: 'Server error checking live status.' });
  }
};

module.exports = {
  goLive,
  endLive,
  getLiveClasses,
  getLiveStatus
};
