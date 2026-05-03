const express = require('express');
const router = express.Router();
const { login, changePassword, getMe, logout, refreshAccessToken } = require('../controllers/authController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { loginLimiter, passwordChangeLimiter, refreshTokenLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, login);
router.post('/refresh', refreshTokenLimiter, refreshAccessToken);
router.post('/change-password', auth, authorize('admin', 'student'), passwordChangeLimiter, changePassword);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);

module.exports = router;
