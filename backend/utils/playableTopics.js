// Throwaway saves from tapping around the app ("test", "asdf") should not
// land in review quizzes. Keep this list in sync with src/utils/matchGame.js.
const THROWAWAY_TERMS = new Set([
  "test",
  "testing",
  "asdf",
  "foo",
  "bar",
  "hello",
  "hi",
  "n/a",
  "placeholder",
]);

function isThrowawayTerm(term) {
  return THROWAWAY_TERMS.has(String(term || "").trim().toLowerCase());
}

function isThrowawayMeaning(text) {
  const cleaned = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!cleaned || THROWAWAY_TERMS.has(cleaned)) {
    return true;
  }

  return /\btest definition\b/.test(cleaned);
}

function isThrowawayTopic(topic) {
  return (
    isThrowawayTerm(topic?.term) || isThrowawayMeaning(topic?.simpleDefinition)
  );
}

function playableReviewTopics(topics) {
  return (topics || []).filter((topic) => !isThrowawayTopic(topic));
}

module.exports = {
  isThrowawayTerm,
  isThrowawayMeaning,
  isThrowawayTopic,
  playableReviewTopics,
};
