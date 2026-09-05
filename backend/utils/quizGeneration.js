// Asks OpenAI for quiz questions about a topic: five questions at each of
// the three difficulty levels, in the question format the learner prefers.
//
// The three levels are requested as three parallel calls rather than one
// big one. Each call is small and independent, so a single bad response
// only costs a retry of that level, and the whole thing finishes in the
// time of one call instead of three in a row.

const openai = require("./openai");
const { MODEL, DIFFICULTY_LEVELS } = require("./studyGuide");

const QUESTIONS_PER_LEVEL = 5;

const QUESTION_TYPES = ["multipleChoice", "trueFalse", "shortAnswer"];

const LEVEL_FOCUS = {
  Beginner: "Focus on foundational understanding and core definitions.",
  Intermediate: "Focus on applying the concept and understanding how it works.",
  Advanced: "Focus on complex reasoning, trade-offs, and edge cases.",
};

const TYPE_RULES = {
  multipleChoice:
    'Provide exactly 4 options. correctAnswer must be the letter of the correct option: "A", "B", "C", or "D" (A is the first option).',
  trueFalse:
    'Provide exactly 2 options: ["true", "false"]. correctAnswer must be the string "true" or "false".',
  shortAnswer:
    "Provide an empty options array. correctAnswer is the expected answer as a short string.",
};

// What the model must return for one difficulty level.
const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctAnswer: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["text", "options", "correctAnswer", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

function buildInstructions(term, questionType, level) {
  return `You are an expert quiz writer for educational content.

Write exactly ${QUESTIONS_PER_LEVEL} ${questionType} questions about the topic "${term}" at ${level} level. ${LEVEL_FOCUS[level]}

Rules for ${questionType} questions: ${TYPE_RULES[questionType]}

Every question needs: text, options, correctAnswer, and a one- or two-sentence explanation of why the answer is correct. Questions must be answerable from general knowledge of the topic and must not depend on each other.`;
}

async function generateLevel(term, questionType, level) {
  const response = await openai.responses.create({
    model: MODEL,
    instructions: buildInstructions(term, questionType, level),
    input: `Write the ${level} quiz for: ${term}`,
    text: {
      format: {
        type: "json_schema",
        name: "quiz_questions",
        strict: true,
        schema: QUESTIONS_SCHEMA,
      },
    },
  });

  const { questions } = JSON.parse(response.output_text);

  // Stamp the type on every question so the frontend can render the right
  // control, and keep true/false answers as strings so grading compares
  // like with like (the quiz page sends booleans; grading stringifies both).
  return questions.slice(0, QUESTIONS_PER_LEVEL).map((question) => ({
    text: question.text,
    type: questionType,
    options: questionType === "shortAnswer" ? [] : question.options,
    correctAnswer: String(question.correctAnswer),
    explanation: question.explanation,
  }));
}

// Returns { Beginner: [...], Intermediate: [...], Advanced: [...] }.
async function generateQuizQuestions(term, questionType = "multipleChoice") {
  const type = QUESTION_TYPES.includes(questionType) ? questionType : "multipleChoice";

  const levels = await Promise.all(
    DIFFICULTY_LEVELS.map((level) => generateLevel(term, type, level)),
  );

  return Object.fromEntries(DIFFICULTY_LEVELS.map((level, i) => [level, levels[i]]));
}

module.exports = {
  QUESTIONS_PER_LEVEL,
  QUESTION_TYPES,
  generateQuizQuestions,
};
