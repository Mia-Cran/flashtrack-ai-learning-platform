// The one OpenAI client for the backend.
//
// The key is optional. Without it the app still runs (accounts, saved
// topics, subjects, feedback, quizzes that already exist), and only the
// three AI actions are switched off: search, regenerate, and quiz creation.
// Those routes answer 503 with a plain message via middleware/requireAI.js.
//
// The real client is built on first use, not at require() time, so a
// missing key never crashes startup and tests can swap the methods below.

const OpenAI = require("openai");

let client = null;

function isConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getClient() {
  if (!isConfigured()) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

// Same shape as the SDK for the two calls this app makes, so callers (and
// tests) never need to know the client is lazy.
module.exports = {
  isConfigured,
  responses: {
    create: (params) => getClient().responses.create(params),
  },
  moderations: {
    create: (params) => getClient().moderations.create(params),
  },
};
