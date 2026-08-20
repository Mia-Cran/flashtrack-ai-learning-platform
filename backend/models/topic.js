const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  term: {
    type: String,
    required: true,
  },
  normalizedTerm: {
    type: String,
    required: true,
  },
  simpleDefinition: {
    type: String,
    required: true,
  },
  beginnerDefinition: {
    type: String,
    required: true,
  },
  technicalDefinition: {
    type: String,
    required: true,
  },
  analogy: {
    type: String,
    required: true,
  },
  codeExample: {
    type: String,
    required: true,
  },
  commonMistake: {
    type: String,
    required: true,
  },
  relatedTopics: {
    type: [String],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Topic", topicSchema);
