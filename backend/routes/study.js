const router = require("express").Router();
const { generateStudyGuide } = require("../controllers/study");
const generateLimiter = require("../middleware/rateLimit");
const optionalAuth = require("../middleware/optionalAuth");
const requireAI = require("../middleware/requireAI");

router.post("/generate", requireAI, optionalAuth, generateLimiter, generateStudyGuide);

module.exports = router;
