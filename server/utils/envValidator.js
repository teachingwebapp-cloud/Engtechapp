/**
 * Environment variable validation on startup
 * Ensures all required configuration is present
 */

const logger = require('./logger');

const requiredEnvVars = {
  // Database
  MONGODB_URI: {
    required: true,
    description: 'MongoDB connection string',
    example: 'mongodb+srv://user:pass@cluster.mongodb.net/db'
  },
  
  // JWT
  JWT_SECRET: {
    required: true,
    description: 'Secret key for JWT access tokens',
    minLength: 32
  },
  JWT_REFRESH_SECRET: {
    required: true,
    description: 'Secret key for JWT refresh tokens',
    minLength: 32
  },
  
  // Server
  PORT: {
    required: false,
    default: '5000',
    description: 'Server port'
  },
  NODE_ENV: {
    required: false,
    default: 'development',
    description: 'Environment (development/production)'
  },
  
  // Security
  MAX_FAILED_LOGINS: {
    required: false,
    default: '5',
    description: 'Maximum failed login attempts before lockout'
  },
  LOCK_DURATION_MS: {
    required: false,
    default: '600000',
    description: 'Account lockout duration in milliseconds'
  }
};

const validateEnv = () => {
  const errors = [];
  const warnings = [];
  
  logger.info('🔍 Validating environment variables...');
  
  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    
    // Check if required variable is missing
    if (config.required && !value) {
      errors.push(`❌ Missing required environment variable: ${key}`);
      if (config.example) {
        errors.push(`   Example: ${config.example}`);
      }
      continue;
    }
    
    // Set default if not provided
    if (!value && config.default) {
      process.env[key] = config.default;
      warnings.push(`⚠️  Using default for ${key}: ${config.default}`);
      continue;
    }
    
    // Check minimum length for secrets
    if (value && config.minLength && value.length < config.minLength) {
      warnings.push(`⚠️  ${key} should be at least ${config.minLength} characters for security`);
    }
    
    if (value) {
      logger.info(`✅ ${key}: Set`);
    }
  }
  
  // Display warnings
  if (warnings.length > 0) {
    logger.warn('\n⚠️  Environment Warnings:');
    warnings.forEach(w => logger.warn(w));
  }
  
  // Display errors and exit if any
  if (errors.length > 0) {
    logger.error('\n❌ Environment Validation Failed:');
    errors.forEach(e => logger.error(e));
    logger.error('\nPlease set the required environment variables and restart the server.');
    process.exit(1);
  }
  
  logger.info('✅ Environment validation passed\n');
};

module.exports = validateEnv;
