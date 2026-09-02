const openai = require("../utils/openai");
const { isTextBlocked } = require("../utils/moderation");
const Subject = require("../models/subject");
const LearnerProfile = require("../models/learnerProfile");

function normalizeSubjectName(name) {
  return typeof name === "string" ? name.trim().toLowerCase() : "";
}

const BLOCKED_TERMS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "um", "uh", "thing", "stuff", "whatever",
]);

function isBlockedTerm(term) {
  return BLOCKED_TERMS.has(term.toLowerCase().trim());
}

const generateStudyGuide = async (req, res) => {
  console.log("📖 Study endpoint called");
  const { term } = req.body;
  console.log("📖 Term:", term);

  if (!term) {
    return res.status(400).send({ message: "A study term is required" });
  }

  if (isBlockedTerm(term)) {
    return res.status(400).send({
      message: "This search couldn't be processed. Please try a different topic.",
    });
  }

  try {
    const isBlocked = await isTextBlocked(term);
    if (isBlocked) {
      return res.status(400).send({
        message: "This search couldn't be processed. Please try a different topic.",
      });
    }

    // Dummy study guide for testing
    return res.status(200).send({
      studyGuide: {
        title: term,
        simpleDefinition: "A simple definition of " + term,
        beginnerExplanation: "Here's how to understand " + term + " as a beginner. It's an important concept you should know.",
        technicalDefinition: "From a technical perspective, " + term + " refers to a specific implementation detail or concept.",
        analogy: "Think of " + term + " like a common real-world object that works in a similar way.",
        codeExample: "// Code example for " + term,
        commonMistake: "A common mistake is to confuse " + term + " with something else entirely.",
        category: "Technology",
        difficulty: "Beginner",
        relatedTopics: ["Related Topic 1", "Related Topic 2", "Related Topic 3"],
        suggestedSubject: "Technology"
      },
      suggestedSubject: null
    });
  } catch (err) {
    console.error("Study error:", err.message);
    return res.status(500).send({ message: "Failed to generate study guide" });
  }
};

module.exports = {
  generateStudyGuide,
};
