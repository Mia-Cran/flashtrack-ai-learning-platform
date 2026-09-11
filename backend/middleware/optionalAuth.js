const jwt = require("jsonwebtoken");

// Like auth.js, but never blocks the request: it decodes the token when one is
// present and valid, and just leaves req.user undefined otherwise. For routes
// (like study generation) that must stay usable by anonymous visitors, but can
// personalize the response when someone happens to be signed in.
const optionalAuth = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next();
  }

  const token = authorization.slice(7);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Invalid/expired token on an optional-auth route just means "treat this
    // request as anonymous" -- not an error worth blocking the request over.
  }

  return next();
};

module.exports = optionalAuth;
