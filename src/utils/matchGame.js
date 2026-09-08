export const MATCH_UNLOCK_COUNT = 4;
export const MATCH_PAIR_COUNT = 4;

export function promptForTopic(topic, explanationStyle) {
  if (explanationStyle === "technical" && topic.technicalDefinition) {
    return topic.technicalDefinition;
  }

  if (explanationStyle === "analogies" && topic.analogy) {
    return topic.analogy;
  }

  return topic.simpleDefinition || "";
}

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

// One round is four saved cards: terms in one column, matching prompts in
// the other. Prompt text follows explanationStyle so analogical learners
// match analogies and technical learners match technical definitions.
export function buildMatchRound(topics, explanationStyle, options = {}) {
  const pairCount = options.pairCount ?? MATCH_PAIR_COUNT;
  const random = options.random ?? Math.random;
  const usable = (topics || []).filter(
    (topic) => topic?._id && topic.term && promptForTopic(topic, explanationStyle),
  );

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
        label: promptForTopic(topic, explanationStyle),
      })),
      random,
    ),
  };
}
