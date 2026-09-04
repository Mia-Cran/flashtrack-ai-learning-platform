const { isTextBlocked } = require("../utils/moderation");
const { generateStudyGuide } = require("../utils/studyGuide");
const Subject = require("../models/subject");
const LearnerProfile = require("../models/learnerProfile");

// Words that can never be a study topic on their own. Cheap to check, so it
// runs before the moderation call and the OpenAI request.
const BLOCKED_TERMS = new Set([
  // Articles
  "the", "a", "an",
  // Conjunctions
  "and", "or", "but",
  // Prepositions
  "in", "on", "at",
  // Fillers
  "um", "uh",
  // Placeholders
  "thing", "stuff", "whatever",
]);

function isBlockedTerm(term) {
  return BLOCKED_TERMS.has(term.toLowerCase().trim());
}

const UNUSABLE_TERM_MESSAGE =
  "This search couldn't be processed. Please try a different topic.";

const generateStudyGuideHandler = async (req, res) => {
  const { term } = req.body;

  if (!term || typeof term !== "string" || !term.trim()) {
    return res.status(400).send({ message: "A study term is required" });
  }

  if (isBlockedTerm(term)) {
    return res.status(400).send({ message: UNUSABLE_TERM_MESSAGE });
  }

  try {
    if (await isTextBlocked(term)) {
      return res.status(400).send({ message: UNUSABLE_TERM_MESSAGE });
    }

    const subjects = await Subject.find({ isActive: true }).sort({ sortOrder: 1 });

    // Search stays open to anonymous visitors (see optionalAuth on the route);
    // a signed-in learner's saved preferences personalize the explanation.
    let learnerProfile = null;
    if (req.user?._id) {
      learnerProfile = await LearnerProfile.findOne({ user: req.user._id });
    }

    const { studyGuide, matchedSubject } = await generateStudyGuide({
      term: term.trim(),
      subjects,
      learnerProfile,
    });

    if (!studyGuide) {
      return res.status(400).send({
        message:
          "This topic is not suitable for learning. Please search for an educational subject.",
      });
    }

    return res.status(200).send({
      studyGuide: {
        ...studyGuide,
        // The frontend needs the subject's id to preselect it in the picker,
        // not just the name the model chose.
        suggestedSubject: matchedSubject
          ? {
              _id: matchedSubject._id,
              name: matchedSubject.name,
              slug: matchedSubject.slug,
            }
          : null,
      },
    });
  } catch (err) {
    // Surface the real OpenAI/network reason (never the API key) so deploy
    // debugging is not a blind "paste the key again" loop.
    const detail =
      err?.error?.message ||
      err?.message ||
      (typeof err === "string" ? err : "Unknown error");
    console.error("Study guide generation failed:", detail);
    return res.status(500).send({
      message: "Failed to generate study guide",
      detail: String(detail).slice(0, 300),
      status: err?.status || null,
    });
  }
};

module.exports = {
  generateStudyGuide: generateStudyGuideHandler,
  isBlockedTerm,
};
