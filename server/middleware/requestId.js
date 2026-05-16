/**
 * Request ID middleware for tracing requests across logs
 */

const { v4: uuidv4 } = require('uuid');

const requestId = (req, res, next) => {
  // Check if request ID already exists (from load balancer or proxy)
  const existingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  
  // Generate new ID if not present
  req.id = existingId || uuidv4();
  
  // Add to response headers for client-side debugging
  res.setHeader('X-Request-ID', req.id);
  
  next();
};

module.exports = requestId;
