const Quiz = require("../models/quiz");
const UserQuizResponse = require("../models/userQuizResponse");
const Topic = require("../models/topic");
const LearnerProfile = require("../models/learnerProfile");
const { generateQuizQuestions } = require("../utils/quizGeneration");
const { DIFFICULTY_LEVELS } = require("../utils/studyGuide");

// POST /quizzes/:topicId/generate (signed in)
//
// Creates the quiz for one of the caller's saved topics. A topic only ever
// has one quiz, so a second call returns the existing one with 200 instead
// of generating again (generation costs three OpenAI calls).
const generateQuiz = async (req, res) => {
  const { topicId } = req.params;

  try {
    const topic = await Topic.findOne({ _id: topicId, owner: req.user._id });
    if (!topic) {
      return res.status(404).send({ message: "Topic not found" });
    }

    const existingQuiz = await Quiz.findOne({ topic: topicId });
    if (existingQuiz) {
      return res.status(200).send(existingQuiz);
    }

    // Use the learner's preferred question format when they have set one.
    const profile = await LearnerProfile.findOne({ user: req.user._id });
    const questionType = profile?.learningPreferences?.questionType || "multipleChoice";

    const questions = await generateQuizQuestions(topic.term, questionType);

    const quiz = await Quiz.create({ topic: topicId, questions });
    return res.status(201).send(quiz);
  } catch (err) {
    // Two requests racing to create the same quiz: the unique index rejects
    // the second one. Hand back the winner instead of an error.
    if (err.code === 11000) {
      const quiz = await Quiz.findOne({ topic: topicId });
      return res.status(200).send(quiz);
    }

    if (err.name === "CastError") {
      return res.status(400).send({ message: "Invalid topic id" });
    }

    console.error("Quiz generation failed:", err);
    return res.status(500).send({ message: "Failed to generate quiz" });
  }
};

// The quiz GET is public, so it must never include the answer key. Grading
// happens server-side in submitQuizResponse, which reads the full document
// from the database, so removing these fields here does not affect scoring.
const withoutAnswers = (question) => {
  const publicQuestion = { ...question };
  delete publicQuestion.correctAnswer;
  delete publicQuestion.explanation;
  return publicQuestion;
};

// GET /quizzes/:topicId
const getQuiz = async (req, res) => {
  const { topicId } = req.params;

  try {
    // .lean() returns a plain object instead of a Mongoose document, so we
    // can safely build a copy without the answer fields.
    const quiz = await Quiz.findOne({ topic: topicId }).populate("topic").lean();

    if (!quiz) {
      return res.status(404).send({ message: "Quiz not found" });
    }

    const questions = {};
    for (const level of DIFFICULTY_LEVELS) {
      questions[level] = (quiz.questions?.[level] ?? []).map(withoutAnswers);
    }

    return res.send({ ...quiz, questions });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).send({ message: "Invalid topic id" });
    }

    console.error(err);
    return res.status(500).send({ message: "Error getting quiz" });
  }
};

// POST /quizzes/:quizId/submit (signed in)
// Body: { difficulty, responses: [{ userAnswer }, ...] } in question order.
const submitQuizResponse = async (req, res) => {
  const { quizId } = req.params;
  const { difficulty, responses } = req.body;

  if (!DIFFICULTY_LEVELS.includes(difficulty)) {
    return res.status(400).send({
      message: "difficulty must be Beginner, Intermediate, or Advanced",
    });
  }

  if (!Array.isArray(responses)) {
    return res.status(400).send({ message: "responses must be an array" });
  }

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).send({ message: "Quiz not found" });
    }

    const questions = quiz.questions[difficulty] ?? [];

    if (responses.length !== questions.length) {
      return res.status(400).send({
        message: `Expected ${questions.length} responses for the ${difficulty} quiz`,
      });
    }

    // Compare as strings so a true/false answer sent as a boolean still
    // matches the stored "true"/"false", and multiple-choice letters match
    // regardless of how they were serialized.
    const graded = responses.map((response, index) => {
      const question = questions[index];
      const userAnswer = response?.userAnswer ?? null;
      const isCorrect =
        userAnswer !== null &&
        String(question.correctAnswer).trim().toLowerCase() ===
          String(userAnswer).trim().toLowerCase();

      return { questionId: question._id, userAnswer, isCorrect };
    });

    const score = graded.filter((entry) => entry.isCorrect).length;

    const quizResponse = await UserQuizResponse.create({
      user: req.user._id,
      quiz: quizId,
      difficulty,
      responses: graded,
      score,
      maxScore: questions.length,
    });

    return res.status(201).send(quizResponse);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).send({ message: "Invalid quiz id" });
    }

    console.error(err);
    return res.status(500).send({ message: "Failed to submit quiz response" });
  }
};

module.exports = {
  generateQuiz,
  getQuiz,
  submitQuizResponse,
};
