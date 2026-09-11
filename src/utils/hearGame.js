import {
  MATCH_UNLOCK_COUNT,
  playableMatchTopics,
  promptForTopic,
  shuffleList,
} from "./matchGame";

export const HEAR_UNLOCK_COUNT = MATCH_UNLOCK_COUNT;
export const HEAR_CARD_COUNT = 4;

export function playableHearTopics(topics) {
  return playableMatchTopics(topics);
}

// One round is four saved cards. The browser speaks the term (same idea as
// Hear it on the study card). The learner picks the matching short meaning
// from those four cards. No extra model call.
export function buildHearRound(topics, options = {}) {
  const cardCount = options.cardCount ?? HEAR_CARD_COUNT;
  const random = options.random ?? Math.random;
  const usable = playableHearTopics(topics);

  if (usable.length < cardCount) {
    return null;
  }

  const picked = shuffleList(usable, random).slice(0, cardCount);
  const meanings = picked.map((topic) => ({
    id: String(topic._id),
    label: promptForTopic(topic),
  }));

  return {
    cards: picked.map((topic) => ({
      id: String(topic._id),
      term: topic.term,
      spoken: topic.term,
      options: shuffleList(meanings, random),
    })),
  };
}
