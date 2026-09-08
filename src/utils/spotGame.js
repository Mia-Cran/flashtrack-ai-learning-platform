import {
  compactMeaning,
  isPlayableMatchTopic,
  promptForTopic,
  shuffleList,
} from "./matchGame";

export const SPOT_UNLOCK_COUNT = 4;
export const SPOT_CARD_COUNT = 4;

function oneLine(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function isUsableMistake(topic) {
  const mistake = compactMeaning(topic?.commonMistake);

  if (!mistake) {
    return false;
  }

  if (/may refer to:/i.test(mistake)) {
    return false;
  }

  if (/\btest definition\b/i.test(oneLine(topic?.commonMistake))) {
    return false;
  }

  return mistake.toLowerCase() !== promptForTopic(topic).toLowerCase();
}

export function isPlayableSpotTopic(topic) {
  return isPlayableMatchTopic(topic) && isUsableMistake(topic);
}

export function playableSpotTopics(topics) {
  return (topics || []).filter(isPlayableSpotTopic);
}

// One round is four saved cards. Each card shows the term plus two
// statements: the real short meaning, and the common-mistake note already
// stored on the card. No extra model call.
export function buildSpotRound(topics, options = {}) {
  const cardCount = options.cardCount ?? SPOT_CARD_COUNT;
  const random = options.random ?? Math.random;
  const usable = playableSpotTopics(topics);

  if (usable.length < cardCount) {
    return null;
  }

  const picked = shuffleList(usable, random).slice(0, cardCount);

  return {
    cards: picked.map((topic) => {
      const meaning = promptForTopic(topic);
      const mistake = compactMeaning(topic.commonMistake);

      return {
        id: String(topic._id),
        term: topic.term,
        options: shuffleList(
          [
            { kind: "mistake", label: mistake },
            { kind: "meaning", label: meaning },
          ],
          random,
        ),
      };
    }),
  };
}
