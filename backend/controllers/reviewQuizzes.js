const ReviewQuiz = require("../models/reviewQuiz");
const Topic = require("../models/topic");
const {
  REVIEW_MIN_TOPICS,
  REVIEW_MAX_TOPICS,
  generateReviewQuestions,
} = require("../utils/reviewQuizGeneration");

const withoutAnswers = (question) => {
  const publicQuestion =
    typeof question.toObject === "function" ? question.toObject() : { ...question };
  delete publicQuestion.correctAnswer;
  delete publicQuestion.explanation;
  return publicQuestion;
};

// POST /quizzes/review/generate
// Builds a fresh mixed MC quiz from the learner's most recent saved cards.
const generateReviewQuiz = async (req, res) => {
  try {
    const topics = await Topic.find({ owner: req.user._id })
      .sort({ _id: -1 })
      .limit(REVIEW_MAX_TOPICS)
      .select("_id term");

    if (topics.length < REVIEW_MIN_TOPICS) {
      return res.status(400).send({
        message: `Save at least ${REVIEW_MIN_TOPICS} flashcards before starting a review quiz.`,
        savedCount: topics.length,
        requiredCount: REVIEW_MIN_TOPICS,
      });
    }

    const questions = await generateReviewQuestions(topics);

    const reviewQuiz = await ReviewQuiz.create({
      user: req.user._id,
      topics: topics.map((topic) => topic._id),
      questions,
    });

    return res.status(201).send({
      _id: reviewQuiz._id,
      topics: reviewQuiz.topics,
      questions: reviewQuiz.questions.map(withoutAnswers),
      createdAt: reviewQuiz.createdAt,
    });
  } catch (err) {
    console.error("Review quiz generation failed:", err);
    return res.status(500).send({ message: "Failed to generate review quiz" });
  }
};

// GET /quizzes/review/:reviewQuizId
const getReviewQuiz = async (req, res) => {
  try {
    const reviewQuiz = await ReviewQuiz.findById(req.params.reviewQuizId).lean();

    if (!reviewQuiz) {
      return res.status(404).send({ message: "Review quiz not found" });
    }

    if (String(reviewQuiz.user) !== String(req.user._id)) {
      return res.status(403).send({ message: "Not allowed to view this quiz" });
    }

    return res.send({
      ...reviewQuiz,
      questions: (reviewQuiz.questions ?? []).map(withoutAnswers),
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).send({ message: "Invalid review quiz id" });
    }

    console.error(err);
    return res.status(500).send({ message: "Error getting review quiz" });
  }
};

// POST /quizzes/review/:reviewQuizId/submit
// Body: { responses: [{ userAnswer }, ...] } in question order.
// Returns score plus which topics were missed so the UI can offer drills.
const submitReviewQuiz = async (req, res) => {
  const { responses } = req.body;

  if (!Array.isArray(responses)) {
    return res.status(400).send({ message: "responses must be an array" });
  }

  try {
    const reviewQuiz = await ReviewQuiz.findById(req.params.reviewQuizId);

    if (!reviewQuiz) {
      return res.status(404).send({ message: "Review quiz not found" });
    }

    if (String(reviewQuiz.user) !== String(req.user._id)) {
      return res.status(403).send({ message: "Not allowed to submit this quiz" });
    }

    const questions = reviewQuiz.questions ?? [];

    if (responses.length !== questions.length) {
      return res.status(400).send({
        message: `Expected ${questions.length} responses for this review quiz`,
      });
    }

    const graded = responses.map((response, index) => {
      const question = questions[index];
      const userAnswer = response?.userAnswer ?? null;
      const isCorrect =
        userAnswer !== null &&
        String(question.correctAnswer).trim().toLowerCase() ===
          String(userAnswer).trim().toLowerCase();

      return {
        questionId: question._id,
        topicId: question.topic,
        term: question.term,
        userAnswer,
        isCorrect,
      };
    });

    const score = graded.filter((entry) => entry.isCorrect).length;
    const missedByTopic = new Map();

    graded.forEach((entry) => {
      if (entry.isCorrect) {
        return;
      }

      const key = String(entry.topicId);
      if (!missedByTopic.has(key)) {
        missedByTopic.set(key, {
          _id: entry.topicId,
          term: entry.term,
        });
      }
    });

    return res.status(201).send({
      score,
      maxScore: questions.length,
      responses: graded,
      missedTopics: [...missedByTopic.values()],
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).send({ message: "Invalid review quiz id" });
    }

    console.error(err);
    return res.status(500).send({ message: "Failed to submit review quiz" });
  }
};

module.exports = {
  generateReviewQuiz,
  getReviewQuiz,
  submitReviewQuiz,
};
