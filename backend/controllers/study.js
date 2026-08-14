const openai = require("../utils/openai");

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

    const response = await openai.responses.create({
      model: "gpt-5.5",
      instructions: `
    You are FlashTrack, a patient software engineering instructor.

    Your job is to help students build confidence while learning software engineering.
     
    Teach beginner software engineering students in clear, plain English.
    
    Do not assume the student already understands technical language.

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
            ],
            additionalProperties: false,
          },
        },
      },
    });
    return res.status(200).send({
      studyGuide: JSON.parse(response.output_text),
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
