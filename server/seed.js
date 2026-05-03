require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin already exists. Skipping seed.');
      process.exit(0);
    }

    // Create Admin
    const admin = await User.create({
      studentId: 'ADMIN-001',
      name: 'admin',
      phone: '0000000000',
      role: 'admin',
      password: 'admin123',
      isActive: true,
      mustChangePassword: false
    });
    console.log('✅ Admin created:');
    console.log(`   Login ID: admin`);
    console.log(`   Password: admin123`);

    // Create Teacher
    const teacher = await User.create({
      studentId: 'TEACH-001',
      name: 'teacher01',
      phone: '1111111111',
      role: 'admin',
      password: 'admin123',
      createdBy: admin._id,
      isActive: true,
      mustChangePassword: false
    });
    console.log('✅ Teacher created:');
    console.log(`   Login ID: teacher01`);
    console.log(`   Password: admin123`);

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDB();
