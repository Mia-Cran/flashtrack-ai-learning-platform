const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["multipleChoice", "trueFalse", "shortAnswer"],
    required: true,
  },
  // For multiple choice and true/false
  options: [String],
  // Correct answer(s) - for MC it's the index, for TF it's true/false, for SA it's text
  correctAnswer: mongoose.Schema.Types.Mixed,
  // Explanation shown after answering
  explanation: {
    type: String,
    required: true,
  },
});

const quizSchema = new mongoose.Schema({
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true,
  },
  // 3 sets of 5 questions each
  questions: {
    Beginner: [questionSchema],
    Intermediate: [questionSchema],
    Advanced: [questionSchema],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure only one quiz per topic
quizSchema.index({ topic: 1 }, { unique: true });

module.exports = mongoose.model("Quiz", quizSchema);
