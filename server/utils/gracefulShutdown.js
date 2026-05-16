/**
 * Graceful shutdown handler
 * Ensures connections are closed properly on deployment/restart
 */

const logger = require('./logger');
const mongoose = require('mongoose');

let isShuttingDown = false;

const gracefulShutdown = (server, io) => {
  const shutdown = async (signal) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress...');
      return;
    }
    
    isShuttingDown = true;
    logger.info(`\n${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(async () => {
      logger.info('✅ HTTP server closed');
      
      try {
        // Close Socket.io connections
        if (io) {
          io.close(() => {
            logger.info('✅ Socket.io connections closed');
          });
        }
        
        // Close database connection
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
          logger.info('✅ MongoDB connection closed');
        }
        
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };
  
  // Listen for termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
};

module.exports = gracefulShutdown;
