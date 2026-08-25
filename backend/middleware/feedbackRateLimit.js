const rateLimit = require("express-rate-limit");

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too much feedback from this device. Please try again in a few minutes.",
  },
});

module.exports = feedbackLimiter;
