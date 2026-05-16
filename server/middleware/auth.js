const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug(`Token decoded: ${decoded.id} - ${decoded.role}`);

    // Bypass Mongoose if not connected in dev
    if (process.env.NODE_ENV === 'development' && mongoose.connection.readyState === 0) {
      return res.status(503).json({ message: 'Database connection failed. Please try again later.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      logger.warn(`User not found in database: ${decoded.id}`);
      return res.status(401).json({ message: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated.' });
    }

    req.user = user;
    logger.debug(`Auth successful - User: ${req.user.studentId} (${req.user.role})`);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    logger.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error.' });
  }
};

module.exports = auth;
