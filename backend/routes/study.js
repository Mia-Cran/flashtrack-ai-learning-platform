const router = require("express").Router();
const { generateStudyGuide } = require("../controllers/study");
const auth = require("../middleware/auth");

router.post("/generate", auth, generateStudyGuide);

module.exports = router;