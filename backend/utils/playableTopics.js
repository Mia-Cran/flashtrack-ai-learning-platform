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

function playableReviewTopics(topics) {
  return (topics || []).filter((topic) => !isThrowawayTerm(topic.term));
}

module.exports = {
  isThrowawayTerm,
  playableReviewTopics,
};
