/**
 * Teacher Management Controller
 * Handles teacher account creation and management by admin
 */

const User = require('../models/User');
const Class = require('../models/Class');
const logActivity = require('../middleware/activityLogger');
const logger = require('../utils/logger');
const { generatePassword } = require('../utils/generatePassword');
const { generateId } = require('../utils/generateId');

// POST /api/teachers - Admin creates teacher account
const createTeacher = async (req, res) => {
  try {
    const { name, phone, email, specialization, bio } = req.body;

    // Generate credentials
    const teacherId = await generateId('TCH');
    const password = generatePassword();

    // Create teacher
    const teacher = await User.create({
      studentId: teacherId,
      name,
      phone,
      email,
      role: 'teacher',
      password,
      plainTextPassword: password,
      isActive: true,
      mustChangePassword: true,
      createdBy: req.user._id,
      teacherInfo: {
        specialization,
        bio,
        joinedAt: new Date()
      }
    });

    await logActivity(
      req.user._id,
      'create_teacher',
      null,
      `Created teacher account: ${name} (${teacherId})`
    );

    logger.info(`Teacher created: ${teacherId} by admin ${req.user.studentId}`);

    res.status(201).json({
      message: 'Teacher account created successfully',
      teacher: {
        id: teacher._id,
        teacherId: teacher.studentId,
        name: teacher.name,
        phone: teacher.phone,
        email: teacher.email,
        password: password,
        specialization: teacher.teacherInfo?.specialization,
        bio: teacher.teacherInfo?.bio
      }
    });
  } catch (error) {
    logger.error('Create teacher error:', error);
    res.status(500).json({ message: 'Server error creating teacher.' });
  }
};

// GET /api/teachers - Get all teachers
const getTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, isActive } = req.query;
    const skip = (page - 1) * limit;

    const query = { role: 'teacher' };

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Active filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const teachers = await User.find(query)
      .select('-password -refreshTokens -failedLoginAttempts -lockUntil')
      .populate('createdBy', 'name studentId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    // Get class count for each teacher
    const teachersWithStats = await Promise.all(
      teachers.map(async (teacher) => {
        const classCount = await Class.countDocuments({ teacherId: teacher._id });
        const activeClasses = await Class.countDocuments({ 
          teacherId: teacher._id, 
          status: { $in: ['scheduled', 'live'] }
        });
        
        return {
          ...teacher,
          stats: {
            totalClasses: classCount,
            activeClasses
          }
        };
      })
    );

    res.json({
      teachers: teachersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get teachers error:', error);
    res.status(500).json({ message: 'Server error fetching teachers.' });
  }
};

// GET /api/teachers/:id - Get teacher details
const getTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await User.findOne({ _id: id, role: 'teacher' })
      .select('-password -refreshTokens -failedLoginAttempts -lockUntil')
      .populate('createdBy', 'name studentId')
      .lean();

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    // Get teacher's classes
    const classes = await Class.find({ teacherId: id })
      .select('title schedule status isLive')
      .sort({ schedule: -1 })
      .limit(10)
      .lean();

    // Get statistics
    const stats = {
      totalClasses: await Class.countDocuments({ teacherId: id }),
      scheduledClasses: await Class.countDocuments({ teacherId: id, status: 'scheduled' }),
      completedClasses: await Class.countDocuments({ teacherId: id, status: 'completed' }),
      liveClasses: await Class.countDocuments({ teacherId: id, status: 'live' })
    };

    res.json({
      teacher,
      classes,
      stats
    });
  } catch (error) {
    logger.error('Get teacher error:', error);
    res.status(500).json({ message: 'Server error fetching teacher.' });
  }
};

// PATCH /api/teachers/:id - Update teacher
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, specialization, bio, isActive } = req.body;

    const teacher = await User.findOne({ _id: id, role: 'teacher' });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    // Update fields
    if (name) teacher.name = name;
    if (phone) teacher.phone = phone;
    if (email) teacher.email = email;
    if (isActive !== undefined) teacher.isActive = isActive;

    // Update teacher info
    if (specialization !== undefined) {
      teacher.teacherInfo = teacher.teacherInfo || {};
      teacher.teacherInfo.specialization = specialization;
    }
    if (bio !== undefined) {
      teacher.teacherInfo = teacher.teacherInfo || {};
      teacher.teacherInfo.bio = bio;
    }

    await teacher.save();

    await logActivity(
      req.user._id,
      'update_teacher',
      null,
      `Updated teacher: ${teacher.name} (${teacher.studentId})`
    );

    res.json({
      message: 'Teacher updated successfully',
      teacher: {
        id: teacher._id,
        teacherId: teacher.studentId,
        name: teacher.name,
        phone: teacher.phone,
        email: teacher.email,
        isActive: teacher.isActive,
        specialization: teacher.teacherInfo?.specialization,
        bio: teacher.teacherInfo?.bio
      }
    });
  } catch (error) {
    logger.error('Update teacher error:', error);
    res.status(500).json({ message: 'Server error updating teacher.' });
  }
};

// DELETE /api/teachers/:id - Delete teacher (soft delete)
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await User.findOne({ _id: id, role: 'teacher' });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    // Check if teacher has active classes
    const activeClasses = await Class.countDocuments({
      teacherId: id,
      status: { $in: ['scheduled', 'live'] }
    });

    if (activeClasses > 0) {
      return res.status(400).json({
        message: `Cannot delete teacher with ${activeClasses} active classes. Please reassign or complete them first.`
      });
    }

    // Soft delete
    teacher.isActive = false;
    await teacher.save();

    await logActivity(
      req.user._id,
      'delete_teacher',
      null,
      `Deleted teacher: ${teacher.name} (${teacher.studentId})`
    );

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    logger.error('Delete teacher error:', error);
    res.status(500).json({ message: 'Server error deleting teacher.' });
  }
};

// PATCH /api/teachers/:id/toggle-status - Toggle teacher active status
const toggleTeacherStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await User.findOne({ _id: id, role: 'teacher' });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    teacher.isActive = !teacher.isActive;
    await teacher.save();

    await logActivity(
      req.user._id,
      'toggle_teacher_status',
      null,
      `${teacher.isActive ? 'Activated' : 'Deactivated'} teacher: ${teacher.name}`
    );

    res.json({
      message: `Teacher ${teacher.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: teacher.isActive
    });
  } catch (error) {
    logger.error('Toggle teacher status error:', error);
    res.status(500).json({ message: 'Server error toggling status.' });
  }
};

// PATCH /api/admin/toggle-teaching - Admin toggles their teaching ability
const toggleAdminTeaching = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id);

    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can toggle teaching ability.' });
    }

    admin.canTeach = !admin.canTeach;
    await admin.save();

    await logActivity(
      req.user._id,
      'toggle_admin_teaching',
      null,
      `Admin ${admin.canTeach ? 'enabled' : 'disabled'} teaching ability`
    );

    res.json({
      message: `Teaching ability ${admin.canTeach ? 'enabled' : 'disabled'}`,
      canTeach: admin.canTeach
    });
  } catch (error) {
    logger.error('Toggle admin teaching error:', error);
    res.status(500).json({ message: 'Server error toggling teaching.' });
  }
};

module.exports = {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  toggleTeacherStatus,
  toggleAdminTeaching
};
