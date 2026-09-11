const express = require("express");
const auth = require("../middleware/auth");
const generateLimiter = require("../middleware/rateLimit");
const requireAI = require("../middleware/requireAI");
const {
  generateQuiz,
  getQuiz,
  submitQuizResponse,
} = require("../controllers/quizzes");
const { getQuizResponses } = require("../controllers/progress");
const {
  generateReviewQuiz,
  getReviewQuiz,
  submitReviewQuiz,
} = require("../controllers/reviewQuizzes");

const router = express.Router();

// Mixed review quiz across saved cards. These paths must be registered
// before "/:topicId" or Express will treat "review" as a topic id.
router.post(
  "/review/generate",
  requireAI,
  auth,
  generateLimiter,
  generateReviewQuiz,
);
router.get("/review/:reviewQuizId", auth, getReviewQuiz);
router.post("/review/:reviewQuizId/submit", auth, submitReviewQuiz);

// Past attempts for one quiz (must stay before "/:topicId").
router.get("/:quizId/responses", auth, getQuizResponses);

// Generate a quiz for a topic (requires auth). Rate limited because this
// makes three OpenAI calls per request -- same limiter /study/generate uses.
router.post("/:topicId/generate", requireAI, auth, generateLimiter, generateQuiz);

// Get quiz for a topic (public, can view questions without logging in)
router.get("/:topicId", getQuiz);

// Submit quiz responses (requires auth)
router.post("/:quizId/submit", auth, submitQuizResponse);

module.exports = router;
