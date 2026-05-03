const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try multiple environment variable names (Railway sometimes has issues)
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

    if (!uri) {
      console.warn('⚠️ MONGODB_URI not set. Database will be unavailable.');
      console.warn('   To use the app, install MongoDB and set MONGODB_URI in .env');
      console.warn('   Checked: MONGODB_URI, MONGO_URI, DATABASE_URL');
      return;
    }
    
    console.log('✅ Using MongoDB URI from:', process.env.MONGODB_URI ? 'MONGODB_URI' : process.env.MONGO_URI ? 'MONGO_URI' : 'DATABASE_URL');

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.warn('   The application requires MongoDB to be running.');
    console.warn('   Visit: https://www.mongodb.com/try/download/community');
  }
};

module.exports = connectDB;
