const router = require("express").Router();
const { generateStudyGuide } = require("../controllers/study");
const generateLimiter = require("../middleware/rateLimit");

router.post("/generate", generateLimiter, generateStudyGuide);

module.exports = router;