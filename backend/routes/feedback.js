const router = require("express").Router();
const optionalAuth = require("../middleware/optionalAuth");
const feedbackLimiter = require("../middleware/feedbackRateLimit");
const { createFeedback, getFeedback } = require("../controllers/feedback");

router.get("/", getFeedback);
router.post("/", optionalAuth, feedbackLimiter, createFeedback);

module.exports = router;
