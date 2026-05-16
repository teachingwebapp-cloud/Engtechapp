/**
 * Request timeout middleware to prevent hanging connections
 */

const logger = require('../utils/logger');

const timeout = (seconds = 30) => {
  return (req, res, next) => {
    // Set timeout
    req.setTimeout(seconds * 1000, () => {
      logger.warn(`Request timeout: ${req.method} ${req.path} [${req.id}]`);
      
      if (!res.headersSent) {
        res.status(408).json({
          message: 'Request timeout. Please try again.',
          requestId: req.id
        });
      }
    });
    
    // Set response timeout
    res.setTimeout(seconds * 1000, () => {
      logger.warn(`Response timeout: ${req.method} ${req.path} [${req.id}]`);
      
      if (!res.headersSent) {
        res.status(504).json({
          message: 'Gateway timeout. Please try again.',
          requestId: req.id
        });
      }
    });
    
    next();
  };
};

module.exports = timeout;
