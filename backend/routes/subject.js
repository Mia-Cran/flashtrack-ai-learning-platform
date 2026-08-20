const router = require("express").Router();
const { getSubjects } = require("../controllers/subject");

router.get("/", getSubjects);

module.exports = router;
