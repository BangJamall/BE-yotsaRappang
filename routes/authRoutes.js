const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const loginRateLimiter = require('../middleware/loginRateLimiter');
const verifyToken = require('../middleware/authMiddleware');

// Public route
router.post('/login', loginRateLimiter, login);

// Protected route (butuh token)
router.get('/me', verifyToken, getMe);

module.exports = router;