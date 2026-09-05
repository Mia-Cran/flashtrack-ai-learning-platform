const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  sortOrder: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // A handful of curated topics a student can jump straight into when
  // browsing this subject from the nav dropdown (Session 10, entry point 2).
  // Purely a discovery aid -- picking one just fills the search box, same as
  // any other example topic. It never classifies the resulting search; the
  // AI still assigns whatever subject the searched term actually belongs to.
  exampleTopics: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("Subject", subjectSchema);
