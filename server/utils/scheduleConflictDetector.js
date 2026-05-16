/**
 * Schedule Conflict Detection Utility
 * Detects when multiple teachers schedule classes at the same time
 */

const Class = require('../models/Class');
const logger = require('./logger');
const { getIO } = require('../socket');

/**
 * Check for schedule conflicts when creating/updating a class
 * @param {Date} schedule - Class schedule time
 * @param {Number} duration - Class duration in minutes
 * @param {String} classId - Current class ID (for updates)
 * @returns {Object} - { hasConflict, conflictingClasses }
 */
const checkScheduleConflict = async (schedule, duration = 60, classId = null) => {
  try {
    const scheduleDate = new Date(schedule);
    const endTime = new Date(scheduleDate.getTime() + duration * 60000);

    // Find classes that overlap with this time slot
    const query = {
      status: { $in: ['scheduled', 'live'] },
      $or: [
        // Class starts during this class
        {
          schedule: {
            $gte: scheduleDate,
            $lt: endTime
          }
        },
        // Class ends during this class
        {
          $expr: {
            $and: [
              { $lte: '$schedule', scheduleDate },
              { 
                $gte: { 
                  $add: ['$schedule', { $multiply: ['$duration', 60000] }] 
                }, 
                scheduleDate 
              }
            ]
          }
        }
      ]
    };

    // Exclude current class if updating
    if (classId) {
      query._id = { $ne: classId };
    }

    const conflictingClasses = await Class.find(query)
      .populate('teacherId', 'name studentId email')
      .select('title schedule duration teacherId status')
      .lean();

    return {
      hasConflict: conflictingClasses.length > 0,
      conflictingClasses,
      conflictCount: conflictingClasses.length
    };
  } catch (error) {
    logger.error('Schedule conflict check error:', error);
    return { hasConflict: false, conflictingClasses: [], conflictCount: 0 };
  }
};

/**
 * Notify teachers about schedule conflicts
 * @param {String} teacherId - Teacher creating the class
 * @param {Object} classData - New class data
 * @param {Array} conflictingClasses - Conflicting classes
 */
const notifyScheduleConflict = async (teacherId, classData, conflictingClasses) => {
  try {
    const io = getIO();
    if (!io) return;

    // Notify the teacher creating the class
    io.to(`teacher_${teacherId}`).emit('schedule_conflict', {
      type: 'warning',
      message: `Your class "${classData.title}" conflicts with ${conflictingClasses.length} other class(es)`,
      classData,
      conflictingClasses: conflictingClasses.map(c => ({
        id: c._id,
        title: c.title,
        teacher: c.teacherId?.name,
        schedule: c.schedule,
        duration: c.duration
      }))
    });

    // Notify other teachers whose classes conflict
    for (const conflictClass of conflictingClasses) {
      if (conflictClass.teacherId?._id) {
        io.to(`teacher_${conflictClass.teacherId._id}`).emit('schedule_conflict', {
          type: 'info',
          message: `Another teacher scheduled a class at the same time as your class "${conflictClass.title}"`,
          conflictingClass: {
            title: classData.title,
            teacher: classData.teacherName,
            schedule: classData.schedule
          }
        });
      }
    }

    // Notify all admins
    io.to('admins').emit('schedule_conflict_admin', {
      type: 'alert',
      message: `Schedule conflict detected: ${conflictingClasses.length + 1} classes at the same time`,
      classes: [
        {
          title: classData.title,
          teacher: classData.teacherName,
          schedule: classData.schedule
        },
        ...conflictingClasses.map(c => ({
          title: c.title,
          teacher: c.teacherId?.name,
          schedule: c.schedule
        }))
      ]
    });

    logger.warn(`Schedule conflict: ${conflictingClasses.length + 1} classes at ${classData.schedule}`);
  } catch (error) {
    logger.error('Notify schedule conflict error:', error);
  }
};

/**
 * Update conflict status for all affected classes
 * @param {Array} classIds - Array of class IDs
 * @param {Boolean} hasConflict - Conflict status
 */
const updateConflictStatus = async (classIds, hasConflict = true) => {
  try {
    await Class.updateMany(
      { _id: { $in: classIds } },
      { 
        $set: { 
          hasConflict,
          conflictingClasses: hasConflict ? classIds : []
        } 
      }
    );
  } catch (error) {
    logger.error('Update conflict status error:', error);
  }
};

/**
 * Get all schedule conflicts for admin dashboard
 * @returns {Array} - Array of conflict groups
 */
const getAllScheduleConflicts = async () => {
  try {
    const conflictingClasses = await Class.find({
      hasConflict: true,
      status: { $in: ['scheduled', 'live'] }
    })
      .populate('teacherId', 'name studentId email')
      .select('title schedule duration teacherId status conflictingClasses')
      .sort({ schedule: 1 })
      .lean();

    // Group by time slot
    const conflictGroups = {};
    
    for (const classItem of conflictingClasses) {
      const timeKey = new Date(classItem.schedule).toISOString();
      
      if (!conflictGroups[timeKey]) {
        conflictGroups[timeKey] = {
          schedule: classItem.schedule,
          classes: []
        };
      }
      
      conflictGroups[timeKey].classes.push({
        id: classItem._id,
        title: classItem.title,
        teacher: classItem.teacherId?.name,
        teacherId: classItem.teacherId?._id,
        duration: classItem.duration,
        status: classItem.status
      });
    }

    // Convert to array and filter groups with actual conflicts
    return Object.values(conflictGroups)
      .filter(group => group.classes.length > 1)
      .sort((a, b) => new Date(a.schedule) - new Date(b.schedule));
  } catch (error) {
    logger.error('Get all conflicts error:', error);
    return [];
  }
};

module.exports = {
  checkScheduleConflict,
  notifyScheduleConflict,
  updateConflictStatus,
  getAllScheduleConflicts
};
