const mongoose = require('mongoose');
const User = require('../models/User');
const generateStudentId = require('../utils/generateId');
const generatePassword = require('../utils/generatePassword');
const logActivity = require('../middleware/activityLogger');

// POST /api/users — Create student (Teacher only)
const createStudent = async (req, res) => {
  try {
    const { name, phone, studentId } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    // If no studentId provided, generate one (for backwards compatibility)
    let finalStudentId = studentId;
    if (!finalStudentId) {
      finalStudentId = await generateStudentId();
    }

    const plainPassword = generatePassword(8);

    const student = await User.create({
      studentId: finalStudentId,
      name,
      phone: phone || '',
      role: 'student',
      password: plainPassword,
      plainTextPassword: plainPassword,
      createdBy: req.user._id,
      isActive: true,
      mustChangePassword: false
    });

    await logActivity(req.user._id, 'create_student', null, `Created student: ${finalStudentId}`);

    res.status(201).json({
      message: 'Student created successfully.',
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        password: plainPassword,
        role: student.role,
        isActive: student.isActive
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Student ID already exists. Please use a different ID.' });
    }
    res.status(500).json({ message: 'Server error creating student.' });
  }
};

// GET /api/users — List all users (Teacher only)
const getUsers = async (req, res) => {
  try {
    // --- Development Mock (if DB is disconnected) ---
    if (process.env.NODE_ENV === 'development' && mongoose.connection.readyState === 0) {
      const mockUsers = [
        {
          _id: '607f1f77bcf86cd799439013',
          name: 'Demo Student 1',
          studentId: 'STUD-001',
          role: 'student',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          _id: '607f1f77bcf86cd799439014',
          name: 'Demo Student 2',
          studentId: 'STUD-002',
          role: 'student',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      return res.json({
        users: mockUsers,
        pagination: { page: 1, limit: 20, total: 2, pages: 1 }
      });
    }
    // -------------------------------------------------

    // Students cannot access user list
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Access denied. Students cannot view user lists.' });
    }

    const { role, status, page = 1, limit = 20, search, includePasswords } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    // Admin-Teacher filtering:
    // Regular admins (Teachers) only see students they created.
    // The Super-Admin (studentId: 'admin') sees ALL students.
    if (req.user.role === 'admin' && req.user.studentId !== 'admin') {
      filter.role = 'student';
      filter.createdBy = req.user._id;
    } else if (req.user.role === 'admin' && req.user.studentId === 'admin') {
      // Super-admin: Can filter by role if provided, otherwise sees all students by default
      if (!role) filter.role = 'student';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);

    // Include plainTextPassword only for the super-admin teacher ('admin')
    const shouldIncludePasswords = includePasswords === 'true' && req.user.studentId === 'admin';
    const projection = shouldIncludePasswords
      ? '-failedLoginAttempts -lockUntil -password' // Admin-teacher gets everything except secure hash
      : '-password -plainTextPassword -phone -failedLoginAttempts -lockUntil'; // Others get sanitized

    const users = await User.find(filter)
      .select(projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
};

// GET /api/users/:id — Get single user (Teacher only)
const getUser = async (req, res) => {
  try {
    // Students cannot access other user profiles
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Access denied. Students cannot view other user profiles.' });
    }

    const projection = '-password -phone -failedLoginAttempts -lockUntil';
    const user = await User.findById(req.params.id).select(projection);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Teacher can only view their own students
    if (req.user.role === 'admin') {
      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Access denied.' });
      }
      if (!user.createdBy || user.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user.' });
  }
};

// PATCH /api/users/:id/status — Activate/Deactivate user (Admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Cannot deactivate yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own status.' });
    }

    // Admin-Teacher check:
    // Regular admins (Teachers) can only toggle their own students.
    // The Super-Admin can toggle anyone.
    if (req.user.role === 'admin' && req.user.studentId !== 'admin') {
      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Access denied.' });
      }
      if (!user.createdBy || user.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only manage your own students.' });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    await logActivity(
      req.user._id,
      user.isActive ? 'activate_user' : 'deactivate_user',
      null,
      `${user.isActive ? 'Activated' : 'Deactivated'} user: ${user.name}`
    );

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user: { id: user._id, name: user.name, isActive: user.isActive }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating user status.' });
  }
};

// DELETE /api/users/:id — Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    if (req.user.studentId !== 'admin') {
      return res.status(403).json({ message: 'Only Admin can delete user accounts.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Admins shouldn't delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own admin account.' });
    }

    await User.findByIdAndDelete(req.params.id);

    await logActivity(
      req.user._id,
      'delete_user',
      null,
      `Permanently deleted user: ${user.name} (${user.studentId})`
    );

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
};

module.exports = { createStudent, getUsers, getUser, toggleUserStatus, deleteUser };
