const openai = require("../utils/openai");
const Subject = require("../models/subject");
const LearnerProfile = require("../models/learnerProfile");

function normalizeSubjectName(name) {
  return typeof name === "string" ? name.trim().toLowerCase() : "";
}

const BLOCKED_MODERATION_CATEGORIES = [
  "hate",
  "hate/threatening",
  "harassment",
  "harassment/threatening",
  "self-harm",
  "self-harm/intent",
  "self-harm/instructions",
  "sexual",
  "sexual/minors",
  "violence",
  "violence/graphic",
  "illicit",
  "illicit/violent",
];

const PACING_INSTRUCTIONS = {
  fast: "Keep explanations brief and to-the-point -- favor short, direct sentences over a fuller build-up.",
  slow: "Take a fuller, more gradual approach -- walk through ideas step by step rather than compressing them.",
};

const EXPLANATION_STYLE_INSTRUCTIONS = {
  analogies: "Lean heavily on the real-world analogy -- make it vivid and refer back to it in the beginner explanation too.",
  technical: "Emphasize technical precision and depth over analogy -- a reader who wants the mechanism, not just the metaphor.",
};

// Builds an extra instructions block from a signed-in learner's saved
// preferences, or returns an empty string if they have none set (or are
// searching anonymously). Deliberately does not touch the AI's own
// "difficulty" classification for the topic -- that stays an honest
// assessment of the topic itself. This only shapes HOW it's explained.
function buildPersonalizationInstructions(profile) {
  if (!profile) {
    return "";
  }

  const lines = [];

  if (profile.preferredDifficulty) {
    lines.push(
      `- This student's preferred difficulty level is ${profile.preferredDifficulty}. Calibrate how much background knowledge you assume, and how much you scaffold the beginner explanation and technical definition, to that level.`,
    );
  }

  const pacingInstruction = PACING_INSTRUCTIONS[profile.learningPreferences?.pacing];
  if (pacingInstruction) {
    lines.push(`- ${pacingInstruction}`);
  }

  const styleInstruction =
    EXPLANATION_STYLE_INSTRUCTIONS[profile.learningPreferences?.explanationStyle];
  if (styleInstruction) {
    lines.push(`- ${styleInstruction}`);
  }

  if (lines.length === 0) {
    return "";
  }

  return `\n\n    This student has saved learning preferences. Use them to shape how you explain, without changing your honest difficulty classification of the topic itself:\n${lines.join("\n")}\n`;
}

const generateStudyGuide = async (req, res) => {
  const { term } = req.body;

  if (!term) {
    return res.status(400).send({
      message: "A study term is required",
    });
  }

  try {
    const moderation = await openai.moderations.create({ input: term });
    const { categories } = moderation.results[0];

    const isBlocked = BLOCKED_MODERATION_CATEGORIES.some(
      (category) => categories[category] === true,
    );

    if (isBlocked) {
      return res.status(400).send({
        message:
          "This search couldn't be processed. Please try a different topic.",
      });
    }

    const subjects = await Subject.find({ isActive: true }).sort({
      sortOrder: 1,
    });
    const subjectNames = subjects.map((subject) => subject.name);

    // Optional: only present when the request carried a valid token (search
    // itself stays public/anonymous-friendly -- see optionalAuth middleware).
    let learnerProfile = null;

    if (req.user?._id) {
      learnerProfile = await LearnerProfile.findOne({ user: req.user._id });
    }

    const personalizationInstructions = buildPersonalizationInstructions(learnerProfile);

    const response = await openai.responses.create({
      model: "gpt-5.5",
      instructions: `
    You are FlashTrack, a patient instructor who can teach any subject a student wants to learn — software engineering, math, science, history, languages, test prep, business, the arts, and more.

    Your job is to help students build confidence while learning, whatever the subject.

    Teach beginners in clear, plain English.

    Do not assume the student already understands specialized or technical language.

    Always return your response in the exact order requested.

    Never skip a section.

    If a code example is not appropriate, explain why instead of leaving it blank.

    
    For every topic, include:
    
    - A simple definition
    - A beginner-friendly explanation
    - A technical definition
    - A real-world analogy
    - A short code example when code is relevant
    - One common mistake beginners make
    - A category
    - A difficulty level: Beginner, Intermediate, or Advanced
    - Three related topics
    - A suggested subject: choose the single best match from this exact list
      and respond with the exact text of one item from it, nothing else:
      ${subjectNames.join(", ")}
${personalizationInstructions}          `,
      input: `Create a study guide for: ${term}`,
      text: {
        format: {
          type: "json_schema",
          name: "study_guide",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              simpleDefinition: { type: "string" },
              beginnerExplanation: { type: "string" },
              technicalDefinition: { type: "string" },
              analogy: { type: "string" },
              codeExample: { type: "string" },
              commonMistake: { type: "string" },
              category: { type: "string" },
              difficulty: { type: "string" },
              relatedTopics: {
                type: "array",
                items: { type: "string" },
              },
              suggestedSubject: { type: "string" },
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
          },
        },
      },
    });
    const studyGuide = JSON.parse(response.output_text);

    const matchedSubject = subjects.find(
      (subject) =>
        normalizeSubjectName(subject.name) ===
        normalizeSubjectName(studyGuide.suggestedSubject),
    );

    return res.status(200).send({
      studyGuide: {
        ...studyGuide,
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
    console.error(err);

    return res.status(500).send({
      message: "Failed to generate study guide",
    });
  }
};

module.exports = {
  generateStudyGuide,
};
