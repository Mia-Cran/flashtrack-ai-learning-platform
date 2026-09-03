const express = require("express");
const auth = require("../middleware/auth");
const generateLimiter = require("../middleware/rateLimit");
const {
  generateQuiz,
  getQuiz,
  submitQuizResponse,
} = require("../controllers/quizzes");

const router = express.Router();

// Generate a quiz for a topic (requires auth). Rate limited because this
// makes three OpenAI calls per request -- same limiter /study/generate uses.
router.post("/:topicId/generate", auth, generateLimiter, generateQuiz);

// Get quiz for a topic (public, can view questions without logging in)
router.get("/:topicId", getQuiz);

// Submit quiz responses (requires auth)
router.post("/:quizId/submit", auth, submitQuizResponse);

module.exports = router;
