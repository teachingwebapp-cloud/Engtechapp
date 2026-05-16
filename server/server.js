// Load environment variables from .env file in development only
// In production (Railway), environment variables are injected directly
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
}

// Validate environment variables on startup
const validateEnv = require('./utils/envValidator');
validateEnv();

// Initialize logger
const logger = require('./utils/logger');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/db');
const User = require('./models/User');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const enrollmentRoutes = require('./routes/enrollments');
const activityLogRoutes = require('./routes/activityLogs');
const permissionRoutes = require('./routes/permissions');
const teacherRoutes = require('./routes/teachers');
const groupChatRoutes = require('./routes/groupChat');

// Import middleware
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const requestId = require('./middleware/requestId');
const timeout = require('./middleware/timeout');

const app = express();

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

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
      logger.info('✅ Admin account seeded');
      logger.info('   Login ID: admin');
      logger.info('   Password: admin123');
    } else {
      logger.info('✅ Admin account exists');
    }
  } catch (error) {
    logger.error('⚠️ Seed on boot failed:', error.message);
  }
};

const mongoose = require('mongoose');

// Connect to MongoDB with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await connectDB();
      if (mongoose.connection.readyState === 1) {
        await seedOnBoot();
        return;
      }
    } catch (err) {
      logger.error(`❌ MongoDB connection attempt ${i + 1}/${retries} failed: ${err.message}`);
      if (i < retries - 1) {
        logger.info(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error('❌ Failed to connect to MongoDB after all retries');
      }
    }
  }
};

connectWithRetry();

// Middleware - Order matters!
// 1. Request ID (must be first for logging)
app.use(requestId);

// 2. Security headers
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

// 3. CORS
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
      'https://web-production-cced82.up.railway.app' // Current Railway app domain
    ].filter(Boolean);

    // If the origin matches any of the allowed origins, or if the origin is the same as the host
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 4. Compression
app.use(compression());

// 5. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. HTTP logging with Winston
const morgan = require('morgan');
app.use(morgan('combined', { stream: logger.stream }));

// 7. Request timeout
app.use(timeout(30));

// 8. Rate limiting
app.use(apiLimiter);

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
app.use('/api/teachers', teacherRoutes);
app.use('/api/group-chat', groupChatRoutes);

// Health check with database connectivity
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: 'disconnected'
  };

  try {
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.database = 'connected';
    }
  } catch (error) {
    health.status = 'degraded';
    health.database = 'error';
    logger.error('Health check database ping failed:', error.message);
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
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

// Global error handler (must be last)
app.use(errorHandler);

const http = require('http');
const { setupSocket } = require('./socket');
const gracefulShutdown = require('./utils/gracefulShutdown');

const server = http.createServer(app);
const io = setupSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
  logger.info(`📊 Logging: Winston with file rotation`);
});

// Setup graceful shutdown
gracefulShutdown(server, io);

module.exports = app;
