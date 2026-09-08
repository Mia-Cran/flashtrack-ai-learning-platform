export const MATCH_UNLOCK_COUNT = 4;
export const MATCH_PAIR_COUNT = 4;

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

function oneLine(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

// Match tiles need a short meaning, not a paragraph. Analogies and
// technical definitions made the board look like cut-off essays.
export function compactMeaning(text) {
  const cleaned = oneLine(text);

  if (!cleaned) {
    return "";
  }

  const sentence = cleaned.match(/^.+?[.!?](?:\s|$)/);
  const short = (sentence ? sentence[0] : cleaned).trim();

  if (short.length <= 140) {
    return short;
  }

  return `${short.slice(0, 137).trim()}…`;
}

export function promptForTopic(topic) {
  return compactMeaning(topic?.simpleDefinition);
}

function isThrowawayMeaning(text) {
  const cleaned = oneLine(text).toLowerCase();

  if (!cleaned || THROWAWAY_TERMS.has(cleaned)) {
    return true;
  }

  return /\btest definition\b/.test(cleaned);
}

export function isPlayableMatchTopic(topic) {
  const term = oneLine(topic?.term);

  if (!topic?._id || !term) {
    return false;
  }

  if (THROWAWAY_TERMS.has(term.toLowerCase())) {
    return false;
  }

  if (isThrowawayMeaning(topic?.simpleDefinition)) {
    return false;
  }

  const meaning = promptForTopic(topic);

  if (!meaning || /may refer to:/i.test(meaning)) {
    return false;
  }

  return true;
}

export function playableMatchTopics(topics) {
  return (topics || []).filter(isPlayableMatchTopic);
}

export const playableSavedTopics = playableMatchTopics;

export function shuffleList(items, random = Math.random) {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const current = next[i];
    next[i] = next[j];
    next[j] = current;
  }

  return next;
}

// One round is four saved cards: terms in one column, matching short
// definitions in the other. Throwaway "test" saves are skipped so they
// don't show up as weird options.
export function buildMatchRound(topics, options = {}) {
  const pairCount = options.pairCount ?? MATCH_PAIR_COUNT;
  const random = options.random ?? Math.random;
  const usable = playableMatchTopics(topics);

  if (usable.length < pairCount) {
    return null;
  }

  const picked = shuffleList(usable, random).slice(0, pairCount);

  return {
    terms: shuffleList(
      picked.map((topic) => ({ id: String(topic._id), label: topic.term })),
      random,
    ),
    prompts: shuffleList(
      picked.map((topic) => ({
        id: String(topic._id),
        label: promptForTopic(topic),
      })),
      random,
    ),
  };
}
