const Topic = require("../models/topic");
const openai = require("../utils/openai");
const { isTextBlocked } = require("../utils/moderation");
const Subject = require("../models/subject");
const LearnerProfile = require("../models/learnerProfile");

const DIFFICULTY_INSTRUCTIONS = {
  Beginner:
    "Assume zero prior background in this subject. Define every term before using it. Do not compress this for the sake of brevity.",
  Intermediate:
    "Assume the student already knows the fundamentals of this subject. Do not re-explain basic terminology from scratch -- spend your words on the parts of this topic that actually need explaining.",
  Advanced:
    "Assume the student already works comfortably in this subject. Skip introductory scaffolding entirely and go straight to precise, technical explanation -- treat them as a peer, not a newcomer.",
};

const PACING_INSTRUCTIONS = {
  fast: "Keep every section to 1-3 sentences. Do not pad with a fuller build-up -- get to the point immediately.",
  slow: "Walk through this step by step across several sentences. Do not compress -- a fuller, more gradual build-up is what this student wants, even if it takes longer to read.",
};

const EXPLANATION_STYLE_INSTRUCTIONS = {
  analogies:
    "Make the real-world analogy the centerpiece of your beginner explanation, not just a side note -- lean on it heavily and refer back to it.",
  technical:
    "Skip the plain-English hand-holding in the technical definition. Use the field's actual terminology and go for precision and depth over accessibility -- this reader wants the real mechanism, not a simplified version of it.",
};

function normalizeSubjectName(name) {
  return typeof name === "string" ? name.trim().toLowerCase() : "";
}

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

  return `\n\n    IMPORTANT: this specific student has saved learning preferences below. These preferences OVERRIDE the "teach a total beginner in plain English, assume no prior knowledge" guidance above wherever the two conflict -- that default only applies when a student has no stated preference. Do not soften or hedge these back toward beginner-friendly phrasing. This does not change your honest difficulty classification of the topic itself, only how you explain it:\n${lines.join("\n")}\n`;
}

const getTopics = (req, res) => {
  Topic.find({ owner: req.user._id })
    .populate("subject")
    .then((topics) => {
      res.send(topics);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send({ message: "Error getting topics" });
    });
};

const getTopicById = (req, res) => {
  const { id } = req.params;

  Topic.findOne({
    _id: id,
    owner: req.user._id,
  })
    .populate("subject")
    .then((topic) => {
      if (!topic) {
        return res.status(404).send({ message: "Topic not found" });
      }

      return res.send(topic);
    })
    .catch((err) => {
      console.error(err);

      if (err.name === "CastError") {
        return res.status(400).send({ message: "Invalid topic id" });
      }

      return res.status(500).send({ message: "Error getting topic" });
    });
};

const deleteTopic = (req, res) => {
  const { id } = req.params;

  Topic.findOneAndDelete({
    _id: id,
    owner: req.user._id,
  })
    .then((topic) => {
      if (!topic) {
        return res.status(404).send({ message: "Topic not found" });
      }

      return res.send({ message: "Topic deleted" });
    })
    .catch((err) => {
      console.error(err);

      if (err.name === "CastError") {
        return res.status(400).send({ message: "Invalid topic id" });
      }

      return res.status(500).send({ message: "Error deleting topic" });
    });
};

const updateTopic = (req, res) => {
  const { id } = req.params;

  Topic.findOneAndUpdate(
    {
      _id: id,
      owner: req.user._id,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("subject")
    .then((topic) => {
      if (!topic) {
        return res.status(404).send({ message: "Topic not found" });
      }

      return res.send(topic);
    })
    .catch((err) => {
      console.error(err);

      if (err.name === "CastError") {
        return res.status(400).send({ message: "Invalid topic id" });
      }

      return res.status(500).send({ message: "Error updating topic" });
    });
};

const createTopic = (req, res) => {
  const {
    term,
    searchTerm,
    simpleDefinition,
    beginnerDefinition,
    technicalDefinition,
    analogy,
    codeExample,
    commonMistake,
    relatedTopics,
    category,
    difficulty,
    subject,
  } = req.body;

  const cleanedTerm = term.trim();
  const normalizedTerm = (searchTerm || term).trim().toLowerCase();

  return Topic.findOne({
    normalizedTerm,
    owner: req.user._id,
  })
    .then((existingTopic) => {
      if (existingTopic) {
        return res.status(409).send({
          message: "Topic already saved",
        });
      }

      return Topic.create({
        term: cleanedTerm,
        normalizedTerm,
        simpleDefinition,
        beginnerDefinition,
        technicalDefinition,
        category,
        difficulty,
        analogy,
        codeExample,
        commonMistake,
        relatedTopics,
        subject,
        owner: req.user._id,
      }).then((topic) => {
        return topic.populate("subject");
      }).then((topic) => {
        return res.status(201).send(topic);
      });
    })
    .catch((err) => {
      console.error(err);

      if (err.name === "ValidationError") {
        return res.status(400).send({
          message: "Invalid topic data",
        });
      }

      return res.status(500).send({
        message: "Error creating topic",
      });
    });
};

const regenerateTopic = async (req, res) => {
  const { id } = req.params;
  const { difficulty } = req.body;

  if (!difficulty || !["Beginner", "Intermediate", "Advanced"].includes(difficulty)) {
    return res.status(400).send({
      message: "Valid difficulty level is required (Beginner, Intermediate, or Advanced)",
    });
  }

  try {
    const topic = await Topic.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!topic) {
      return res.status(404).send({ message: "Topic not found" });
    }

    const subjects = await Subject.find({ isActive: true }).sort({
      sortOrder: 1,
    });
    const subjectNames = subjects.map((subject) => subject.name);

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

    Write the beginner-friendly explanation and the technical definition as 2-4 short paragraphs (1-3 sentences each), separated by a blank line between paragraphs. Never return either of these as a single unbroken block of text -- a wall of text is hard to read no matter how simple or advanced the content is.


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

    IMPORTANT: The user is requesting this content at ${difficulty} level. Generate at ${difficulty} level specifically, not the original level.
${personalizationInstructions}          `,
      input: `Create a study guide for: ${topic.term}`,
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

    topic.simpleDefinition = studyGuide.simpleDefinition;
    topic.beginnerDefinition = studyGuide.beginnerExplanation;
    topic.technicalDefinition = studyGuide.technicalDefinition;
    topic.analogy = studyGuide.analogy;
    topic.codeExample = studyGuide.codeExample;
    topic.commonMistake = studyGuide.commonMistake;
    topic.category = studyGuide.category;
    topic.difficulty = studyGuide.difficulty;
    topic.relatedTopics = studyGuide.relatedTopics;
    if (matchedSubject) {
      topic.subject = matchedSubject._id;
    }

    const updatedTopic = await topic.save();
    await updatedTopic.populate("subject");

    return res.send(updatedTopic);
  } catch (err) {
    console.error(err);

    if (err.name === "CastError") {
      return res.status(400).send({ message: "Invalid topic id" });
    }

    return res.status(500).send({
      message: "Error regenerating topic",
    });
  }
};

module.exports = {
  getTopics,
  createTopic,
  getTopicById,
  deleteTopic,
  updateTopic,
  regenerateTopic,
};
