const Quiz = require("../models/quiz");
const {
  listQuizAttempts,
  getProgressSummary,
  refreshStrengthsAndStruggles,
} = require("../utils/progress");

// GET /quizzes/:quizId/responses (signed in)
// Past attempts for this quiz, owned by the caller only.
const getQuizResponses = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).select("_id");
    if (!quiz) {
      return res.status(404).send({ message: "Quiz not found" });
    }

    const attempts = await listQuizAttempts(req.user._id, quiz._id);
    return res.send({ attempts });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).send({ message: "Invalid quiz id" });
    }

    console.error(err);
    return res.status(500).send({ message: "Failed to load quiz attempts" });
  }
};

// GET /progress (signed in)
// Dashboard summary: latest score per topic + strengths / struggles.
const getProgress = async (req, res) => {
  try {
    const summary = await getProgressSummary(req.user._id);
    return res.send(summary);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Failed to load progress" });
  }
};

module.exports = {
  getQuizResponses,
  getProgress,
  refreshStrengthsAndStruggles,
};
