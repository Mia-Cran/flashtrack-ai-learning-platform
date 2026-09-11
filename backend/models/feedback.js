const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  // Only ever set when the request carried a valid token -- feedback itself
  // stays open to anonymous visitors (see optionalAuth). Never included in the
  // public GET response -- see feedback controller's getFeedback, which uses
  // .select("message createdAt") to keep this out of the API response entirely.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  // Optional, anonymous-submitter-only contact info. Kept private -- only ever
  // readable by a direct database query, never returned by the API.
  contactEmail: {
    type: String,
    required: false,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
