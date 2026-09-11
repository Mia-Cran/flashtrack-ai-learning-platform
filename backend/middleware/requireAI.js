const openai = require("../utils/openai");

// Put this in front of any route that calls OpenAI. When no key is set the
// route answers 503 with a message the frontend shows as-is, instead of the
// request failing deep inside the SDK with a confusing 500.
const AI_OFF_MESSAGE =
  "AI features are turned off on this server. Add OPENAI_API_KEY to backend/.env to enable search, regenerate, and quiz creation.";

const requireAI = (req, res, next) => {
  if (!openai.isConfigured()) {
    return res.status(503).send({ message: AI_OFF_MESSAGE, aiEnabled: false });
  }
  return next();
};

module.exports = requireAI;
module.exports.AI_OFF_MESSAGE = AI_OFF_MESSAGE;
