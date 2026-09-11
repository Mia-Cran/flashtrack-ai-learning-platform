const router = require("express").Router();
const { getDailyQuote } = require("../controllers/quote");

router.get("/daily", getDailyQuote);

module.exports = router;
