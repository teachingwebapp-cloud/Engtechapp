const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const userRole = req.user.role || 'unknown';
    
    if (!roles.includes(userRole)) {
      console.error(`❌ Authorization failed: User role "${userRole}" not in allowed roles [${roles.join(', ')}]`);
      console.error(`   User:`, { id: req.user._id, role: userRole, studentId: req.user.studentId });
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = authorize;
