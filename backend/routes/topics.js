const router = require("express").Router();
const auth = require("../middleware/auth");
const requireAI = require("../middleware/requireAI");

const {
    getTopics,
    createTopic,
    getTopicById,
    deleteTopic,
    updateTopic,
    regenerateTopic,
} = require("../controllers/topics");

router.get("/", auth, getTopics);
router.post("/", auth, createTopic);
router.get("/:id", auth, getTopicById);
router.put("/:id", auth, updateTopic);
router.patch("/:id", auth, updateTopic);
router.post("/:id/regenerate", requireAI, auth, regenerateTopic);
router.delete("/:id", auth, deleteTopic);

module.exports = router;