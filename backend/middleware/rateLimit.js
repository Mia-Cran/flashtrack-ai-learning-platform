const rateLimit = require("express-rate-limit");

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many searches from this device. Please try again in a few minutes.",
  },
});

module.exports = generateLimiter;
