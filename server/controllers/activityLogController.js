const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// GET /api/activity-logs — Get activity logs (Teacher sees all for their students, Students see their own)
const getActivityLogs = async (req, res) => {
  try {
    const { userId, action, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    // --- Development Mock (if DB is disconnected) ---
    if (process.env.NODE_ENV === 'development' && mongoose.connection.readyState === 0) {
      return res.json({
        logs: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
      });
    }
    // -------------------------------------------------

    if (action) filter.action = { $regex: action, $options: 'i' };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Teacher scope: only see activities for themselves + their students
    if (req.user.role === 'admin') {
      const studentUsers = await User.find({ role: 'student', createdBy: req.user._id }).select('_id');
      const allowedUserIds = [req.user._id, ...studentUsers.map(u => u._id)];
      const allowedUserIdStrings = new Set(allowedUserIds.map(id => id.toString()));

      if (userId) {
        const requested = String(userId);
        filter.userId = allowedUserIdStrings.has(requested) ? userId : { $in: [] };
      } else {
        filter.userId = { $in: allowedUserIds };
      }
    } else if (req.user.role === 'student') {
      // Students can only see their own logs
      filter.userId = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .populate('userId', 'name studentId role')
      .populate('classId', 'title')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ message: 'Server error fetching activity logs.' });
  }
};

// POST /api/activity-logs — Log an activity (any authenticated user)
const createActivityLog = async (req, res) => {
  try {
    const { action, classId, details } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'Action is required.' });
    }

    const log = await ActivityLog.create({
      userId: req.user._id,
      action,
      classId: classId || null,
      details: details || '',
      ipAddress: req.ip,
      timestamp: new Date()
    });

    res.status(201).json({ log });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating activity log.' });
  }
};

// GET /api/activity-logs/stats — Get activity stats (Admin only)
const getActivityStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Teacher scope: only see activities for themselves + their students
    let userScope = {};
    if (req.user.role === 'admin') {
      const studentUsers = await User.find({ role: 'student', createdBy: req.user._id }).select('_id');
      const allowedUserIds = [req.user._id, ...studentUsers.map(u => u._id)];
      userScope = { userId: { $in: allowedUserIds } };
    }

    const todayLogins = await ActivityLog.countDocuments({
      action: 'login',
      timestamp: { $gte: today },
      ...userScope,
    });

    const totalLogs = await ActivityLog.countDocuments(userScope);

    const recentActivity = await ActivityLog.find(userScope)
      .populate('userId', 'name studentId role')
      .populate('classId', 'title')
      .sort({ timestamp: -1 })
      .limit(10);

    // Get action breakdown
    const actionMatchStage = Object.keys(userScope).length > 0 ? { $match: userScope } : null;
    const actionBreakdown = await ActivityLog.aggregate([
      ...(actionMatchStage ? [actionMatchStage] : []),
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      todayLogins,
      totalLogs,
      recentActivity,
      actionBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching stats.' });
  }
};

module.exports = { getActivityLogs, createActivityLog, getActivityStats };
