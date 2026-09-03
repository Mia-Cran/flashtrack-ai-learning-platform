// One place for everything about asking OpenAI for a study card.
//
// Two endpoints need this: POST /study/generate (a new search) and
// POST /topics/:id/regenerate (rebuild a saved card at another difficulty).
// They used to carry their own copy of the same 60-line prompt, which meant
// every wording change had to be made twice and the two drifted apart.

const openai = require("./openai");

// Which model to use. Override with OPENAI_MODEL in backend/.env if you want
// something cheaper or newer without touching code.
const MODEL = process.env.OPENAI_MODEL || "gpt-5.5";

const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

const DIFFICULTY_INSTRUCTIONS = {
  Beginner:
    "Assume zero prior background in this subject. Define every term before using it. Do not compress this for the sake of brevity.",
  Intermediate:
    "Assume the student already knows the fundamentals of this subject. Do not re-explain basic terminology from scratch -- spend your words on the parts of this topic that actually need explaining.",
  Advanced:
    "Assume the student already works comfortably in this subject. Skip introductory scaffolding entirely and go straight to precise, technical explanation -- treat them as a peer, not a newcomer.",
};

const PACING_INSTRUCTIONS = {
  keyPointsOnly:
    "Keep every section to 1-3 sentences. Do not pad with a fuller build-up -- get to the point immediately.",
  stepByStep:
    "Walk through this step by step across several sentences. Do not compress -- a fuller, more gradual build-up is what this student wants, even if it takes longer to read.",
};

const EXPLANATION_STYLE_INSTRUCTIONS = {
  analogies:
    "Make the real-world analogy the centerpiece of your beginner explanation, not just a side note -- lean on it heavily and refer back to it.",
  technical:
    "Skip the plain-English hand-holding in the technical definition. Use the field's actual terminology and go for precision and depth over accessibility -- this reader wants the real mechanism, not a simplified version of it.",
};

// The model returns this exact shape (strict JSON schema), so the code that
// reads the result never has to guess at field names.
const STUDY_GUIDE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    simpleDefinition: { type: ["string", "null"] },
    beginnerExplanation: { type: ["string", "null"] },
    technicalDefinition: { type: ["string", "null"] },
    analogy: { type: ["string", "null"] },
    codeExample: { type: ["string", "null"] },
    commonMistake: { type: ["string", "null"] },
    category: { type: ["string", "null"] },
    difficulty: { type: ["string", "null"] },
    relatedTopics: { type: ["array", "null"], items: { type: "string" } },
    suggestedSubject: { type: ["string", "null"] },
  },
  required: [
    "title",
    "simpleDefinition",
    "beginnerExplanation",
    "technicalDefinition",
    "analogy",
    "codeExample",
    "commonMistake",
    "category",
    "difficulty",
    "relatedTopics",
    "suggestedSubject",
  ],
  additionalProperties: false,
};

function normalizeSubjectName(name) {
  return typeof name === "string" ? name.trim().toLowerCase() : "";
}

// Builds an extra instructions block from a signed-in learner's saved
// preferences, or returns an empty string if they have none (or are searching
// anonymously). This only shapes HOW a topic is explained; the model's own
// difficulty rating of the topic stays an honest assessment.
//
// Framed as an override on purpose: the base prompt says "teach a total
// beginner in plain English", which conflicts with an Advanced/technical
// preference. Without saying which wins, the model drifts back to the base.
function buildPersonalizationInstructions(profile) {
  if (!profile) {
    return "";
  }

  const lines = [];

  const difficultyInstruction = DIFFICULTY_INSTRUCTIONS[profile.preferredDifficulty];
  if (difficultyInstruction) {
    lines.push(`- Preferred difficulty (${profile.preferredDifficulty}): ${difficultyInstruction}`);
  }

  const pacingInstruction = PACING_INSTRUCTIONS[profile.learningPreferences?.pacing];
  if (pacingInstruction) {
    lines.push(`- Pacing: ${pacingInstruction}`);
  }

  const styleInstruction =
    EXPLANATION_STYLE_INSTRUCTIONS[profile.learningPreferences?.explanationStyle];
  if (styleInstruction) {
    lines.push(`- Explanation style: ${styleInstruction}`);
  }

  if (lines.length === 0) {
    return "";
  }

  return `

IMPORTANT: this specific student has saved learning preferences below. These preferences OVERRIDE the "teach a total beginner in plain English, assume no prior knowledge" guidance above wherever the two conflict -- that default only applies when a student has no stated preference. Do not soften or hedge these back toward beginner-friendly phrasing. This does not change your honest difficulty classification of the topic itself, only how you explain it:
${lines.join("\n")}
`;
}

function buildInstructions({ subjectNames, difficulty, learnerProfile }) {
  const difficultyBlock = difficulty
    ? `\n\nIMPORTANT: The student asked for this content at ${difficulty} level. Write it at ${difficulty} level specifically, not at whatever level the topic is usually taught.`
    : "";

  return `You are FlashTrack, a patient instructor who can teach any subject a student wants to learn -- software engineering, math, science, history, languages, test prep, business, the arts, and more.

Your job is to help students build confidence while learning, whatever the subject.

IMPORTANT VALIDATION: Before proceeding, quickly assess if the search term is gibberish or complete nonsense. Only reject if:
- The term is random characters or made-up words (e.g., "asdfghjkl", "xyzzy")
- The term has no recognizable meaning in any language or academic field

Accept all other terms, including food items, everyday objects, or niche topics -- if a student wants to learn about it, create a study guide.

If the search term is invalid gibberish, respond with "INVALID_TOPIC" as a single word in the title field and null for every other field.

Teach beginners in clear, plain English.

Do not assume the student already understands specialized or technical language.

Always return your response in the exact order requested.

Never skip a section.

If a code example is not appropriate, leave the codeExample field as null instead of providing an explanation.

Write the beginner-friendly explanation and the technical definition as 2-4 short paragraphs (1-3 sentences each), separated by a blank line between paragraphs. Never return either of these as a single unbroken block of text -- a wall of text is hard to read no matter how simple or advanced the content is.

For every valid topic, include:

- A simple definition
- A beginner-friendly explanation
- A technical definition
- A real-world analogy
- A short code example when code is relevant (null if not applicable)
- One common mistake beginners make
- A category
- A difficulty level: Beginner, Intermediate, or Advanced
- Three related topics
- A suggested subject: choose the single best match from this exact list
  and respond with the exact text of one item from it, nothing else:
  ${subjectNames.join(", ")}${difficultyBlock}${buildPersonalizationInstructions(learnerProfile)}`;
}

// Asks OpenAI for a study card.
//
//   term            the thing to explain ("recursion", "photosynthesis")
//   subjects        active Subject documents, so the model can pick one
//   learnerProfile  the signed-in user's LearnerProfile, or null
//   difficulty      optional forced level (used by regenerate)
//
// Returns { studyGuide, matchedSubject }. studyGuide is the parsed model
// output; matchedSubject is the Subject document whose name the model chose,
// or null. Returns null for studyGuide when the model rejected the term as
// gibberish, so callers can send a 400 instead of saving nonsense.
async function generateStudyGuide({ term, subjects, learnerProfile = null, difficulty = null }) {
  const subjectNames = subjects.map((subject) => subject.name);

  const response = await openai.responses.create({
    model: MODEL,
    instructions: buildInstructions({ subjectNames, difficulty, learnerProfile }),
    input: `Create a study guide for: ${term}`,
    text: {
      format: {
        type: "json_schema",
        name: "study_guide",
        strict: true,
        schema: STUDY_GUIDE_SCHEMA,
      },
    },
  });

  const studyGuide = JSON.parse(response.output_text);

  if (studyGuide.title === "INVALID_TOPIC") {
    return { studyGuide: null, matchedSubject: null };
  }

  const matchedSubject =
    subjects.find(
      (subject) =>
        normalizeSubjectName(subject.name) === normalizeSubjectName(studyGuide.suggestedSubject),
    ) || null;

  return { studyGuide, matchedSubject };
}

module.exports = {
  MODEL,
  DIFFICULTY_LEVELS,
  generateStudyGuide,
  buildPersonalizationInstructions,
  normalizeSubjectName,
};
