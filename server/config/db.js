const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Try multiple environment variable names (Railway sometimes has issues)
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

    if (!uri) {
      logger.warn('⚠️ MONGODB_URI not set. Database will be unavailable.');
      logger.warn('   To use the app, install MongoDB and set MONGODB_URI in environment');
      logger.warn('   Checked: MONGODB_URI, MONGO_URI, DATABASE_URL');
      return;
    }
    
    logger.info(`Using MongoDB URI from: ${process.env.MONGODB_URI ? 'MONGODB_URI' : process.env.MONGO_URI ? 'MONGO_URI' : 'DATABASE_URL'}`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    logger.warn('   The application requires MongoDB to be running.');
    throw error;
  }
};

module.exports = connectDB;
