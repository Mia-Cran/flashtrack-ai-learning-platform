// Asks OpenAI for quiz questions about a topic: five questions at each of
// the three difficulty levels, in the question format the learner prefers.
//
// The three levels are requested as three parallel calls rather than one
// big one. Each call is small and independent, so a single bad response
// only costs a retry of that level, and the whole thing finishes in the
// time of one call instead of three in a row.

const openai = require("./openai");
const { MODEL, DIFFICULTY_LEVELS } = require("./studyGuide");
const { normalizeMcOptions, isUnusableMcQuestion, letterFromModelAnswer } = require("./quizOptions");

const QUESTIONS_PER_LEVEL = 5;

const QUESTION_TYPES = ["multipleChoice", "trueFalse", "shortAnswer"];

const LEVEL_FOCUS = {
  Beginner: "Focus on foundational understanding and core definitions.",
  Intermediate: "Focus on applying the concept and understanding how it works.",
  Advanced: "Focus on complex reasoning, trade-offs, and edge cases.",
};

const TYPE_RULES = {
  multipleChoice:
    "Provide exactly 4 options. Each option must be a complete answer phrase, never a single letter. correctAnswer must be an exact copy of the winning option's full text (not A/B/C/D).",
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
          text: { type: "string", minLength: 12 },
          options: {
            type: "array",
            items: { type: "string", minLength: 2 },
          },
          correctAnswer: { type: "string", minLength: 2 },
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

function buildInstructions(term, questionType, level, simpleDefinition) {
  const meaning = simpleDefinition
    ? `The student saved this flashcard. Term: "${term}". Meaning: "${simpleDefinition}". Write questions that test that meaning — not a generic word, and not a made-up placeholder.`
    : `Write questions about the topic "${term}".`;

  return `You are an expert quiz writer for educational flashcards.

${meaning}

Write exactly ${QUESTIONS_PER_LEVEL} ${questionType} questions at ${level} level. ${LEVEL_FOCUS[level]}

Rules for ${questionType} questions: ${TYPE_RULES[questionType]}

Every question needs: text, options, correctAnswer, and a one- or two-sentence explanation of why the answer is correct. Questions must be answerable from the flashcard meaning above. Never write "Q1?" or "Question 1". Never use options that are only the letters A, B, C, or D.`;
}

async function requestLevel(term, questionType, level, simpleDefinition) {
  const response = await openai.responses.create({
    model: MODEL,
    instructions: buildInstructions(term, questionType, level, simpleDefinition),
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
  return questions.slice(0, QUESTIONS_PER_LEVEL).map((question) => {
    const options =
      questionType === "shortAnswer"
        ? []
        : questionType === "multipleChoice"
          ? normalizeMcOptions(question.options)
          : question.options;

    return {
      text: question.text,
      type: questionType,
      options,
      correctAnswer:
        questionType === "multipleChoice"
          ? letterFromModelAnswer({ ...question, options })
          : String(question.correctAnswer ?? ""),
      explanation: question.explanation,
    };
  });
}

async function generateLevel(term, questionType, level, simpleDefinition) {
  const mapped = await requestLevel(term, questionType, level, simpleDefinition);

  // The model sometimes returns options ["A","B","C","D"] because
  // correctAnswer is a letter. That's not a quiz — ask once more.
  if (
    questionType === "multipleChoice" &&
    mapped.some((question) => isUnusableMcQuestion(question))
  ) {
    return requestLevel(term, questionType, level, simpleDefinition);
  }

  return mapped;
}

// Returns { Beginner: [...], Intermediate: [...], Advanced: [...] }.
async function generateQuizQuestions(
  term,
  questionType = "multipleChoice",
  { simpleDefinition } = {},
) {
  const type = QUESTION_TYPES.includes(questionType) ? questionType : "multipleChoice";

  const levels = await Promise.all(
    DIFFICULTY_LEVELS.map((level) =>
      generateLevel(term, type, level, simpleDefinition),
    ),
  );

  const questions = Object.fromEntries(
    DIFFICULTY_LEVELS.map((level, i) => [level, levels[i]]),
  );

  if (type === "multipleChoice") {
    for (const level of DIFFICULTY_LEVELS) {
      if (
        (questions[level] || []).some((question) =>
          isUnusableMcQuestion(question),
        )
      ) {
        throw new Error(`${level} quiz came back as placeholder questions`);
      }
    }
  }

  return questions;
}

module.exports = {
  QUESTIONS_PER_LEVEL,
  QUESTION_TYPES,
  generateQuizQuestions,
};
