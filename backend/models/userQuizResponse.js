const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userAnswer: mongoose.Schema.Types.Mixed,
  isCorrect: {
    type: Boolean,
    required: true,
  },
});

const userQuizResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    required: true,
  },
  responses: [responseSchema],
  score: {
    type: Number,
    required: true,
  },
  maxScore: {
    type: Number,
    default: 5,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for quick lookups by user and quiz
userQuizResponseSchema.index({ user: 1, quiz: 1, difficulty: 1 });

module.exports = mongoose.model("UserQuizResponse", userQuizResponseSchema);
