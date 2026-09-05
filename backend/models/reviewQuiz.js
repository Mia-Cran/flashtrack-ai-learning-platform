const mongoose = require("mongoose");

// One multiple-choice question about a single saved topic, used inside a
// cross-topic review quiz (study several cards, then check them together).
const reviewQuestionSchema = new mongoose.Schema({
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true,
  },
  // Denormalized so the UI can label questions without another populate hop.
  term: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["multipleChoice", "trueFalse", "shortAnswer"],
    default: "multipleChoice",
  },
  options: [String],
  correctAnswer: mongoose.Schema.Types.Mixed,
  explanation: {
    type: String,
    required: true,
  },
});

const reviewQuizSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  topics: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
  ],
  questions: [reviewQuestionSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reviewQuizSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("ReviewQuiz", reviewQuizSchema);
