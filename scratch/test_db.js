const mongoose = require('mongoose');
const uri = 'mongodb+srv://teachingwebapp_db_user:teachingwebapp098@cluster0.zfnix89.mongodb.net/?appName=Cluster0';

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB.');

    // test finding admin
    const User = require('../server/models/User'); // wait, the path will be ../server/models/User relative to scratch
    const admin = await User.findOne({ studentId: 'admin' });
    console.log('Admin user found:', admin ? 'Yes' : 'No');

  } catch (error) {
    console.error('Connection error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

testConnection();
