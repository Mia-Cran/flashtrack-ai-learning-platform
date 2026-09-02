const express = require("express");
const auth = require("../middleware/auth");
const {
  generateQuiz,
  getQuiz,
  submitQuizResponse,
} = require("../controllers/quizzes");

const router = express.Router();

// Generate a quiz for a topic (requires auth)
router.post("/:topicId/generate", auth, generateQuiz);

// Get quiz for a topic (public, can view questions without logging in)
router.get("/:topicId", getQuiz);

// Submit quiz responses (requires auth)
router.post("/:quizId/submit", auth, submitQuizResponse);

module.exports = router;
