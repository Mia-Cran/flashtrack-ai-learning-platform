const router = require("express").Router();
const auth = require("../middleware/auth");

const { 
    getTopics, 
    createTopic, 
    getTopicById, 
    deleteTopic,
    updateTopic,
} = require("../controllers/topics");

router.get("/", auth, getTopics);
router.post("/", auth, createTopic);
router.get("/:id", auth,  getTopicById);
router.put("/:id", auth, updateTopic);
router.delete("/:id", auth, deleteTopic);
router.patch("/:id", auth,  updateTopic);

module.exports = router;