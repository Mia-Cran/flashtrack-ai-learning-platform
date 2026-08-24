const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  getLearnerProfile,
  updateLearnerProfile,
} = require("../controllers/learnerProfile");

router.get("/", auth, getLearnerProfile);
router.patch("/", auth, updateLearnerProfile);

module.exports = router;
