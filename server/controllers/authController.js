const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logActivity = require('../middleware/activityLogger');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');

const MAX_FAILED_LOGINS = Number(process.env.MAX_FAILED_LOGINS || 5);
const LOCK_DURATION_MS = Number(process.env.LOCK_DURATION_MS || 10 * 60 * 1000); // 10 minutes

const isPasswordAcceptable = (password) => {
  // Minimum length + at least one letter + at least one number.
  return typeof password === 'string' &&
    password.length >= 6 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password);
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({ message: 'Student ID and password are required.' });
    }

    // Fix #11: Only search by studentId — names are NOT unique and caused wrong-user matches
    const user = await User.findOne({ studentId: studentId });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated. Contact your administrator.' });
    }

    // Account lockout
    if (user.lockUntil && user.lockUntil instanceof Date && user.lockUntil > new Date()) {
      const secondsLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000);
      return res.status(423).json({
        message: `Account locked. Try again in ${secondsLeft} seconds.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const prev = user.failedLoginAttempts || 0;
      const next = prev + 1;
      user.failedLoginAttempts = next;

      if (next >= MAX_FAILED_LOGINS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.failedLoginAttempts = 0; // reset so it doesn't overflow
      }

      await user.save();

      if (user.lockUntil) {
        const secondsLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000);
        return res.status(423).json({
          message: `Account locked. Try again in ${secondsLeft} seconds.`,
        });
      }

      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Successful login: reset lockout state
    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role, user.studentId);
    const refreshToken = generateRefreshToken(user._id, user.role, user.studentId);

    // Store refresh token in database (for token rotation/revocation)
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({ token: refreshToken });
    // Keep only last 5 refresh tokens to prevent token overflow
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save();

    // Log login activity
    const ip = req.ip || req.connection.remoteAddress;
    await logActivity(user._id, 'login', null, 'User logged in', ip);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// POST /api/auth/refresh - Refresh access token using refresh token
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }

    // Check if refresh token exists in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated.' });
    }

    // Verify token is stored in user's record (prevent token reuse after logout)
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({ message: 'Refresh token has been revoked.' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.role, user.studentId);

    res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error during token refresh.' });
  }
};

// POST /api/auth/logout - Logout and revoke refresh token
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken && req.user) {
      // Remove refresh token from database (revoke it)
      await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { refreshTokens: { token: refreshToken } } }
      );
    }

    // Log logout activity
    await logActivity(req.user._id, 'logout', null, 'User logged out');

    res.json({ message: 'Logout successful.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout.' });
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Students are not allowed to change their passwords.' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    if (!isPasswordAcceptable(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters and include at least one letter and one number.',
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // Fix #4: Clear the stored plain-text password once student sets their own password
    user.plainTextPassword = null;

    await user.save();

    await logActivity(user._id, 'password_change', null, 'User changed password');

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -failedLoginAttempts -lockUntil -refreshTokens');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { login, changePassword, getMe, logout, refreshAccessToken };
