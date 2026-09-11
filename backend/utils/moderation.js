const openai = require("./openai");

// Shared with every endpoint that accepts free-form user text before it goes
// anywhere (search terms, Feedback messages). Used to live copy-pasted in
// both study.js and feedback.js -- pulled into one place so adding or
// removing a blocked category only ever needs to happen once.
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

// Runs OpenAI's moderation check on a piece of text and returns true if it
// trips any of the blocked categories above.
async function isTextBlocked(text) {
  // No key means no moderation service. Feedback still posts; the AI
  // routes that matter are already switched off by middleware/requireAI.
  if (!openai.isConfigured()) {
    return false;
  }

  const moderation = await openai.moderations.create({ input: text });
  const { categories } = moderation.results[0];

  return BLOCKED_MODERATION_CATEGORIES.some(
    (category) => categories[category] === true,
  );
}

module.exports = {
  BLOCKED_MODERATION_CATEGORIES,
  isTextBlocked,
};
