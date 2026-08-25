const router = require("express").Router();
const { generateStudyGuide } = require("../controllers/study");
const generateLimiter = require("../middleware/rateLimit");
const optionalAuth = require("../middleware/optionalAuth");

router.post("/generate", optionalAuth, generateLimiter, generateStudyGuide);

module.exports = router;
