#!/usr/bin/env node

/**
 * Generate JWT Secrets for Deployment
 * Run with: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║              JWT Secrets Generator                             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('Copy these secrets to Railway environment variables:\n');

const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('\nJWT_REFRESH_SECRET:');
console.log(jwtRefreshSecret);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  ⚠️  IMPORTANT: Save these secrets securely!                   ║');
console.log('║  You will need them for Railway environment variables.        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
