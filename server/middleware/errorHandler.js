/**
 * Centralized error handling middleware
 * Standardizes error responses across the application
 */

const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error with request ID
  logger.error(`[${req.id}] ${error.statusCode} - ${error.message} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} already exists`;
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Don't leak error details in production
  const response = {
    success: false,
    message: error.message || 'Internal server error',
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && {
      error: err,
      stack: err.stack
    })
  };

  res.status(error.statusCode).json(response);
};

module.exports = { errorHandler, AppError };
