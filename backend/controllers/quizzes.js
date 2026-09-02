const Quiz = require("../models/quiz");
const UserQuizResponse = require("../models/userQuizResponse");
const Topic = require("../models/topic");
const LearnerProfile = require("../models/learnerProfile");
const openai = require("../utils/openai");

const generateQuiz = async (req, res) => {
  const { topicId } = req.params;

  try {
    // Check if quiz already exists for this topic
    const existingQuiz = await Quiz.findOne({ topic: topicId });
    if (existingQuiz) {
      return res.status(409).send({
        message: "Quiz already exists for this topic",
      });
    }

    // Get topic details
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).send({ message: "Topic not found" });
    }

    // Get learner profile to know preferred question type
    let preferredQuestionType = "multipleChoice"; // default
    if (req.user?._id) {
      const profile = await LearnerProfile.findOne({ user: req.user._id });
      if (profile?.learningPreferences?.questionType) {
        preferredQuestionType = profile.learningPreferences.questionType;
      }
    }

    // Generate questions for all 3 difficulty levels
    const response = await openai.responses.create({
      model: "gpt-5.5",
      instructions: `
You are an expert quiz generator for educational content. Create 5 ${preferredQuestionType} questions for the topic: "${topic.term}"

IMPORTANT:
- Generate exactly 5 questions
- Return as valid JSON only, no markdown or extra text
- Question type: ${preferredQuestionType}

For multipleChoice questions:
- Provide 4 options (A, B, C, D)
- correctAnswer should be the letter (A, B, C, or D)

For trueFalse questions:
- Provide 2 options: ["true", "false"]
- correctAnswer should be true or false

For shortAnswer questions:
- No options array needed
- correctAnswer should be a string (accept variations)

Each question must have: text, type, options (if applicable), correctAnswer, explanation

Return JSON in this exact format:
{
  "questions": [
    {
      "text": "question text",
      "type": "${preferredQuestionType}",
      "options": ["option1", "option2", ...],
      "correctAnswer": "answer",
      "explanation": "why this is correct"
    }
  ]
}
      `,
      input: `Generate 5 ${preferredQuestionType} quiz questions for the Beginner level about "${topic.term}". Focus on foundational understanding.`,
      text: {
        format: {
          type: "json_schema",
          name: "quiz_questions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    type: { type: "string" },
                    options: {
                      type: ["array", "null"],
                      items: { type: "string" },
                    },
                    correctAnswer: { type: ["string", "boolean"] },
                    explanation: { type: "string" },
                  },
                  required: ["text", "type", "correctAnswer", "explanation"],
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },
    });

    const beginnerQuestions = JSON.parse(response.output_text).questions;

    // Generate Intermediate questions
    const intermediateResponse = await openai.responses.create({
      model: "gpt-5.5",
      instructions: `
You are an expert quiz generator for educational content. Create 5 ${preferredQuestionType} questions for the topic: "${topic.term}"

IMPORTANT:
- Generate exactly 5 questions
- Return as valid JSON only, no markdown or extra text
- Question type: ${preferredQuestionType}

For multipleChoice questions:
- Provide 4 options (A, B, C, D)
- correctAnswer should be the letter (A, B, C, or D)

For trueFalse questions:
- Provide 2 options: ["true", "false"]
- correctAnswer should be true or false

For shortAnswer questions:
- No options array needed
- correctAnswer should be a string (accept variations)

Each question must have: text, type, options (if applicable), correctAnswer, explanation

Return JSON in this exact format:
{
  "questions": [
    {
      "text": "question text",
      "type": "${preferredQuestionType}",
      "options": ["option1", "option2", ...],
      "correctAnswer": "answer",
      "explanation": "why this is correct"
    }
  ]
}
      `,
      input: `Generate 5 ${preferredQuestionType} quiz questions for the Intermediate level about "${topic.term}". Focus on application and deeper understanding.`,
      text: {
        format: {
          type: "json_schema",
          name: "quiz_questions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    type: { type: "string" },
                    options: {
                      type: ["array", "null"],
                      items: { type: "string" },
                    },
                    correctAnswer: { type: ["string", "boolean"] },
                    explanation: { type: "string" },
                  },
                  required: ["text", "type", "correctAnswer", "explanation"],
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },
    });

    const intermediateQuestions = JSON.parse(
      intermediateResponse.output_text,
    ).questions;

    // Generate Advanced questions
    const advancedResponse = await openai.responses.create({
      model: "gpt-5.5",
      instructions: `
You are an expert quiz generator for educational content. Create 5 ${preferredQuestionType} questions for the topic: "${topic.term}"

IMPORTANT:
- Generate exactly 5 questions
- Return as valid JSON only, no markdown or extra text
- Question type: ${preferredQuestionType}

For multipleChoice questions:
- Provide 4 options (A, B, C, D)
- correctAnswer should be the letter (A, B, C, or D)

For trueFalse questions:
- Provide 2 options: ["true", "false"]
- correctAnswer should be true or false

For shortAnswer questions:
- No options array needed
- correctAnswer should be a string (accept variations)

Each question must have: text, type, options (if applicable), correctAnswer, explanation

Return JSON in this exact format:
{
  "questions": [
    {
      "text": "question text",
      "type": "${preferredQuestionType}",
      "options": ["option1", "option2", ...],
      "correctAnswer": "answer",
      "explanation": "why this is correct"
    }
  ]
}
      `,
      input: `Generate 5 ${preferredQuestionType} quiz questions for the Advanced level about "${topic.term}". Focus on complex reasoning and edge cases.`,
      text: {
        format: {
          type: "json_schema",
          name: "quiz_questions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    type: { type: "string" },
                    options: {
                      type: ["array", "null"],
                      items: { type: "string" },
                    },
                    correctAnswer: { type: ["string", "boolean"] },
                    explanation: { type: "string" },
                  },
                  required: ["text", "type", "correctAnswer", "explanation"],
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },
    });

    const advancedQuestions = JSON.parse(
      advancedResponse.output_text,
    ).questions;

    // Create and save the quiz
    const quiz = await Quiz.create({
      topic: topicId,
      questions: {
        Beginner: beginnerQuestions,
        Intermediate: intermediateQuestions,
        Advanced: advancedQuestions,
      },
    });

    return res.status(201).send(quiz);
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      message: "Failed to generate quiz",
    });
  }
};

// The quiz GET is public, so it must never include the answer key. Grading
// happens server-side in submitQuizResponse, which reads the full document
// from the database, so removing these fields here does not affect scoring.
const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

const withoutAnswers = (question) => {
  const publicQuestion = { ...question };
  delete publicQuestion.correctAnswer;
  delete publicQuestion.explanation;
  return publicQuestion;
};

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
    console.error(err);
    return res.status(500).send({ message: "Error getting quiz" });
  }
};

const submitQuizResponse = async (req, res) => {
  const { quizId } = req.params;
  const { difficulty, responses } = req.body;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).send({ message: "Quiz not found" });
    }

    // Score the responses
    const questions = quiz.questions[difficulty];
    let score = 0;

    responses.forEach((response, index) => {
      const question = questions[index];
      if (
        question.correctAnswer === response.userAnswer ||
        String(question.correctAnswer) === String(response.userAnswer)
      ) {
        score += 1;
      }
    });

    // Save the response
    const quizResponse = await UserQuizResponse.create({
      user: req.user._id,
      quiz: quizId,
      difficulty,
      responses: responses.map((r, i) => ({
        questionId: questions[i]._id,
        userAnswer: r.userAnswer,
        isCorrect:
          String(questions[i].correctAnswer) === String(r.userAnswer),
      })),
      score,
      maxScore: 5,
    });

    return res.status(201).send(quizResponse);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Failed to submit quiz response" });
  }
};

module.exports = {
  generateQuiz,
  getQuiz,
  submitQuizResponse,
};
