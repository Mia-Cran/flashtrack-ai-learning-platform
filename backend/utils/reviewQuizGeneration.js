// Builds a mixed multiple-choice review quiz across several saved topics:
// one question per topic, in a single model call (cheaper than N full quizzes).

const openai = require("./openai");
const { MODEL } = require("./studyGuide");
const { normalizeMcOptions, letterFromModelAnswer, isUnusableMcQuestion } = require("./quizOptions");

const REVIEW_MIN_TOPICS = 5;
const REVIEW_MAX_TOPICS = 10;

const REVIEW_QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topicTerm: { type: "string" },
          text: { type: "string", minLength: 12 },
          options: {
            type: "array",
            items: { type: "string", minLength: 2 },
          },
          correctAnswer: { type: "string", minLength: 2 },
          explanation: { type: "string" },
        },
        required: [
          "topicTerm",
          "text",
          "options",
          "correctAnswer",
          "explanation",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

function buildInstructions(topics) {
  const list = topics
    .map((topic, index) => {
      const meaning = topic.simpleDefinition
        ? ` — ${String(topic.simpleDefinition).replace(/\s+/g, " ").trim()}`
        : "";
      return `${index + 1}. ${topic.term}${meaning}`;
    })
    .join("\n");

  return `You are an expert quiz writer for educational flashcard review.

The learner just studied these flashcards:
${list}

Write exactly one multiple-choice question for EACH topic (same count and order as the list).
Each question must clearly test that one topic's meaning. Do not write a placeholder like "Question about Topic 1".

Rules:
- Provide exactly 4 options per question. Each option must be a real answer phrase, never the letter A, B, C, or D.
- correctAnswer must be an exact copy of the winning option's full text, not a letter.
- topicTerm must be an exact copy of the topic name from the list above.
- Every question needs text, options, correctAnswer, and a one- or two-sentence explanation.
- Never write placeholders like "Q1?" or "Question about Topic 1".
- Questions must be answerable from that flashcard's meaning and must not depend on each other.`;
}

// topics: [{ _id, term }]
// returns [{ topic, term, text, type, options, correctAnswer, explanation }]
async function generateReviewQuestions(topics) {
  const byTerm = new Map(
    topics.map((topic) => [topic.term.trim().toLowerCase(), topic]),
  );

  const response = await openai.responses.create({
    model: MODEL,
    instructions: buildInstructions(topics),
    input: `Write one multiple-choice review question for each topic.`,
    text: {
      format: {
        type: "json_schema",
        name: "review_quiz_questions",
        strict: true,
        schema: REVIEW_QUESTIONS_SCHEMA,
      },
    },
  });

  const { questions } = JSON.parse(response.output_text);
  const mapped = [];
  const usedTopicIds = new Set();

  questions.forEach((question) => {
    const key = String(question.topicTerm || "")
      .trim()
      .toLowerCase();
    const topic = byTerm.get(key);

    if (!topic || usedTopicIds.has(String(topic._id))) {
      return;
    }

    usedTopicIds.add(String(topic._id));
    mapped.push({
      topic: topic._id,
      term: topic.term,
      text: question.text,
      type: "multipleChoice",
      options: normalizeMcOptions(question.options),
      correctAnswer: letterFromModelAnswer({
        ...question,
        options: normalizeMcOptions(question.options),
      }),
      explanation: question.explanation,
    });
  });

  // Do not glue leftover questions onto the wrong topic. A mismatch used
  // to produce a "quiz" whose text was about something else entirely.

  if (mapped.length === 0 || mapped.some(isUnusableMcQuestion)) {
    throw new Error("Review quiz generation returned no usable questions");
  }

  return mapped;
}

module.exports = {
  REVIEW_MIN_TOPICS,
  REVIEW_MAX_TOPICS,
  generateReviewQuestions,
};
