// Finds and fixes saved Topic records left over from the old Wikipedia-based
// content pipeline (pre-AI-generation) that got a disambiguation page instead
// of real content -- these show up as "X may refer to:" repeated across every
// section instead of an actual definition/explanation.
//
// Safe by default: run with no flags to see what's affected (no writes).
// Add --fix to actually regenerate those topics in place through the current
// AI pipeline. Only content fields are touched -- term, owner, and subject
// stay exactly as they were, so a user who already saved this topic doesn't
// lose it or see it move, it just quietly becomes correct.
//
// Run from the backend/ directory: node scripts/fixCorruptedTopics.js [--fix]
require("dotenv").config();
const mongoose = require("mongoose");
const openai = require("../utils/openai");
const Topic = require("../models/topic");

const CORRUPTION_PATTERN = /may refer to/i;

function isCorrupted(topic) {
  return [
    topic.simpleDefinition,
    topic.beginnerDefinition,
    topic.technicalDefinition,
    topic.analogy,
    topic.commonMistake,
  ].some(
    (field) => typeof field === "string" && CORRUPTION_PATTERN.test(field),
  );
}

async function regenerate(term) {
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
    `,
    input: `Create a study guide for: ${term}`,
    text: {
      format: {
        type: "json_schema",
        name: "study_guide",
        strict: true,
        schema: {
          type: "object",
          properties: {
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
          },
          required: [
            "simpleDefinition",
            "beginnerExplanation",
            "technicalDefinition",
            "analogy",
            "codeExample",
            "commonMistake",
            "category",
            "difficulty",
            "relatedTopics",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(response.output_text);
}

async function main() {
  const isFixMode = process.argv.includes("--fix");

  await mongoose.connect(process.env.MONGODB_URI);

  const topics = await Topic.find({});
  const corrupted = topics.filter(isCorrupted);

  console.log(
    `Found ${corrupted.length} corrupted topic(s) out of ${topics.length} total saved topics.\n`,
  );

  corrupted.forEach((topic) => {
    console.log(`- "${topic.term}" (owner: ${topic.owner}, id: ${topic._id})`);
  });

  if (!isFixMode) {
    console.log(
      "\nDry run only -- no changes made. Review the list above, then re-run with --fix to regenerate these topics in place.",
    );
    await mongoose.disconnect();
    return;
  }

  if (corrupted.length === 0) {
    console.log("\nNothing to fix.");
    await mongoose.disconnect();
    return;
  }

  console.log("\nRegenerating...\n");

  for (const topic of corrupted) {
    try {
      const guide = await regenerate(topic.term);

      await Topic.findByIdAndUpdate(topic._id, {
        $set: {
          simpleDefinition: guide.simpleDefinition,
          beginnerDefinition: guide.beginnerExplanation,
          technicalDefinition: guide.technicalDefinition,
          analogy: guide.analogy,
          codeExample: guide.codeExample,
          commonMistake: guide.commonMistake,
          relatedTopics: guide.relatedTopics,
          category: guide.category,
          difficulty: guide.difficulty,
        },
      });

      console.log(`Fixed: "${topic.term}" (id: ${topic._id})`);
    } catch (err) {
      console.error(`Failed to fix "${topic.term}" (id: ${topic._id}):`, err.message);
    }
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
