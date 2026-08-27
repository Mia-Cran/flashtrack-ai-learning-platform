const mongoose = require("mongoose");

const learnerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  preferredDifficulty: {
    type: String,
    required: false,
  },
  learningPreferences: {
    type: new mongoose.Schema(
      {
        // "fast" = brief, to-the-point explanations. "slow" = fuller, more gradual explanations.
        pacing: {
          type: String,
          enum: ["fast", "slow"],
        },
        // "analogies" = lean on real-world analogies. "technical" = lean on technical depth.
        explanationStyle: {
          type: String,
          enum: ["analogies", "technical"],
        },
      },
      { _id: false, strict: false },
    ),
    default: () => ({}),
  },
  accessibilityPreferences: {
    type: new mongoose.Schema(
      {
        reduceMotion: {
          type: Boolean,
          default: false,
        },
        largerText: {
          type: Boolean,
          default: false,
        },
        // Matches this app's existing ADHD-friendly design (see About page): sections
        // stay collapsed until the learner is ready for them.
        sectionsCollapsedByDefault: {
          type: Boolean,
          default: true,
        },
      },
      { _id: false, strict: false },
    ),
    default: () => ({}),
  },
  // Reserved for the future quiz/assessment feature. Left empty until there's a real
  // way to measure this — no proxy or heuristic populates these.
  strengths: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
  ],
  areasOfStruggle: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
  ],
  // Answers to the "guiding questions" a new/undecided learner answers once
  // (Phase 3, Session 10 design -- not a one-time throwaway quiz). Saved
  // here, not just used in the moment, so recommendations can build on them
  // without re-asking. Both optional: a learner with real saved-topic
  // history doesn't need to answer these at all.
  studentStage: {
    type: String,
    enum: ["k12", "college", "trade", "testPrep", "exploring"],
    required: false,
  },
  primaryInterest: {
    type: String,
    required: false,
    trim: true,
  },
});

module.exports = mongoose.model("LearnerProfile", learnerProfileSchema);
