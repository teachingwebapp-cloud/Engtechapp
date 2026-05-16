/**
 * Input validation middleware using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Common validation rules
const validations = {
  // Auth validations
  login: [
    body('studentId')
      .trim()
      .notEmpty().withMessage('Student ID is required')
      .isLength({ min: 2, max: 50 }).withMessage('Student ID must be 2-50 characters'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    validate
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty().withMessage('Refresh token is required'),
    validate
  ],

  // User validations
  createUser: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number format'),
    body('role')
      .optional()
      .isIn(['admin', 'student']).withMessage('Role must be admin or student'),
    validate
  ],

  updateUserStatus: [
    param('id')
      .isMongoId().withMessage('Invalid user ID'),
    body('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean'),
    validate
  ],

  // Class validations
  createClass: [
    body('title')
      .trim()
      .notEmpty().withMessage('Class title is required')
      .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('schedule')
      .notEmpty().withMessage('Schedule is required')
      .isISO8601().withMessage('Invalid date format'),
    body('duration')
      .optional()
      .isInt({ min: 15, max: 300 }).withMessage('Duration must be 15-300 minutes'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
    validate
  ],

  updateClass: [
    param('id')
      .isMongoId().withMessage('Invalid class ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('schedule')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    body('duration')
      .optional()
      .isInt({ min: 15, max: 300 }).withMessage('Duration must be 15-300 minutes'),
    validate
  ],

  // Enrollment validations
  createEnrollment: [
    body('studentIds')
      .isArray({ min: 1 }).withMessage('At least one student ID is required')
      .custom((value) => value.every(id => typeof id === 'string'))
      .withMessage('All student IDs must be strings'),
    body('classId')
      .isMongoId().withMessage('Invalid class ID'),
    validate
  ],

  // Permission validations
  requestPermission: [
    body('classId')
      .isMongoId().withMessage('Invalid class ID'),
    body('requestType')
      .isIn(['microphone', 'camera', 'screen']).withMessage('Invalid request type'),
    body('scheduledEndTime')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    validate
  ],

  approvePermission: [
    param('requestId')
      .isMongoId().withMessage('Invalid request ID'),
    body('visibility')
      .optional()
      .isIn(['individual', 'class']).withMessage('Visibility must be individual or class'),
    body('scheduledEndTime')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    body('approvalNotes')
      .optional()
      .trim()
      .isLength({ max: 300 }).withMessage('Notes must be max 300 characters'),
    validate
  ],

  denyPermission: [
    param('requestId')
      .isMongoId().withMessage('Invalid request ID'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Reason must be max 200 characters'),
    validate
  ],

  // Query validations
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 500 }).withMessage('Limit must be 1-500'),
    validate
  ],

  mongoId: [
    param('id')
      .isMongoId().withMessage('Invalid ID format'),
    validate
  ]
};

// Export validate function separately
validations.validate = validate;

module.exports = validations;
