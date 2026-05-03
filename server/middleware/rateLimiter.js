const rateLimit = require('express-rate-limit');

// Generic rate limiter (used for most endpoints)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// Strict rate limiter for login attempts (5 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests in the limit
  keyGenerator: (req) => {
    // Rate limit by IP + studentId combination to prevent brute force
    return `${req.ip}-${req.body.studentId || 'unknown'}`;
  }
});

// Strict rate limiter for password change (3 attempts per hour)
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each user to 3 password change attempts per hour
  message: 'Too many password change attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID
    return req.user?._id?.toString() || req.ip;
  }
});

// Rate limiter for token refresh (20 requests per hour)
const refreshTokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each user to 20 refresh token requests per hour
  message: 'Too many token refresh attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID
    return req.user?._id?.toString() || req.ip;
  }
});

// Rate limiter for permission requests (10 requests per 5 minutes per student)
const permissionRequestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each student to 10 permission requests per 5 minutes
  message: 'Too many permission requests, please wait before requesting again.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID
    return req.user?._id?.toString() || req.ip;
  }
});

module.exports = {
  apiLimiter,
  loginLimiter,
  passwordChangeLimiter,
  refreshTokenLimiter,
  permissionRequestLimiter
};
