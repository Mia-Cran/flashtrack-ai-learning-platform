const rateLimit = require("express-rate-limit");

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Raised from 10 -> 30 (August 28, 2026): 10 per 15 minutes was too tight
  // for real testing sessions -- a single person clicking through several
  // recommended/related topics in a row could hit it. Still low enough to
  // guard against runaway OpenAI API cost from one device hammering the
  // endpoint.
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many searches from this device. Please try again in a few minutes.",
  },
});

module.exports = generateLimiter;
