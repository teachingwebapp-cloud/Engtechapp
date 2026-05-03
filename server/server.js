require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Ensure NODE_ENV is set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const User = require('./models/User');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const enrollmentRoutes = require('./routes/enrollments');
const activityLogRoutes = require('./routes/activityLogs');
const permissionRoutes = require('./routes/permissions');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

const seedOnBoot = async () => {
  try {
    const existingAdmin = await User.findOne({ studentId: 'admin' });
    if (!existingAdmin) {
      await User.create({
        studentId: 'admin',
        name: 'Admin',
        phone: '0000',
        role: 'admin',
        password: 'admin123',
        isActive: true,
        mustChangePassword: false,
      });
      console.log('✅ Admin account seeded');
      console.log('   Login ID: admin');
      console.log('   Password: admin123');
    } else {
      console.log('✅ Admin account exists');
    }
  } catch (error) {
    console.error('⚠️ Seed on boot failed:', error.message);
  }
};

const mongoose = require('mongoose');

// Connect to MongoDB
connectDB()
  .then(() => {
    if (mongoose.connection.readyState === 1) {
      seedOnBoot();
    } else {
      console.log('⚠️ Skipping seedOnBoot because MongoDB is not connected.');
    }
  })
  .catch((err) => console.error('❌ Failed to connect to DB:', err.message));

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://meet.jit.si", "https://*.jitsi.net"],
      frameSrc: ["'self'", "https://meet.jit.si", "https://*.jitsi.net"],
      connectSrc: ["'self'", "https://meet.jit.si", "wss://meet.jit.si", "https://*.jitsi.net", "wss://*.jitsi.net", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://meet.jit.si"],
      mediaSrc: ["'self'", "https://meet.jit.si"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));
app.use(cors({
  origin: (origin, callback) => {
    // In development or if no origin, allow
    if (process.env.NODE_ENV === 'development' || !origin) {
      return callback(null, true);
    }
    
    // Parse the CLIENT_URL to tolerate trailing slashes
    let configuredUrl = process.env.CLIENT_URL || '';
    if (configuredUrl.endsWith('/')) {
      configuredUrl = configuredUrl.slice(0, -1);
    }

    const allowed = [
      configuredUrl, 
      'http://localhost:5173', 
      'http://localhost:5174',
      'https://web-production-f0f35.up.railway.app' // Hardcode allowing the current Railway app domain
    ].filter(Boolean);

    // If the origin matches any of the allowed origins, or if the origin is the same as the host
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(apiLimiter); // Apply rate limiting to all API routes

// Serve static files (in production, client build is in client/dist folder)
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/permissions', permissionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug directory check
app.get('/api/debug', (req, res) => {
  const fs = require('fs');
  const distPath = path.join(__dirname, '../client/dist');
  try {
    const files = fs.readdirSync(distPath);
    const assetsPath = path.join(distPath, 'assets');
    const assetsFiles = fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [];
    res.json({ path: distPath, files, assetsFiles });
  } catch (err) {
    res.json({ error: err.message, path: distPath });
  }
});

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const http = require('http');
const { setupSocket } = require('./socket');
const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
