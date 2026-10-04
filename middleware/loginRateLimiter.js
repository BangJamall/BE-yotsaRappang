const { rateLimit } = require('express-rate-limit');

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login dari IP ini. Coba lagi setelah 15 menit.',
    });
  },
});

module.exports = loginRateLimiter;
