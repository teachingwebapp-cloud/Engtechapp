const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, classId = null, details = null, ipAddress = null) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      classId,
      details,
      ipAddress,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Activity logging error:', error.message);
  }
};

module.exports = logActivity;
