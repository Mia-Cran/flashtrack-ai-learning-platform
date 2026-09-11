const mongoose = require("mongoose");

const dailyQuoteSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
  },
  quote: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("DailyQuote", dailyQuoteSchema);
