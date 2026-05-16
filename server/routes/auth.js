const express = require('express');
const router = express.Router();
const { login, changePassword, getMe, logout, refreshAccessToken } = require('../controllers/authController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { loginLimiter, passwordChangeLimiter, refreshTokenLimiter } = require('../middleware/rateLimiter');
const validations = require('../middleware/validation');

router.post('/login', loginLimiter, validations.login, login);
router.post('/refresh', refreshTokenLimiter, validations.refreshToken, refreshAccessToken);
router.post('/change-password', auth, authorize('admin', 'teacher', 'student'), passwordChangeLimiter, validations.changePassword, changePassword);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);

module.exports = router;
