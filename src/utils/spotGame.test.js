import { describe, it, expect } from "vitest";
import {
  SPOT_UNLOCK_COUNT,
  buildSpotRound,
  isPlayableSpotTopic,
} from "./spotGame";

const topics = [
  {
    _id: "1",
    term: "Recursion",
    simpleDefinition: "A function that calls itself.",
    commonMistake: "Forgetting the base case.",
  },
  {
    _id: "2",
    term: "Closure",
    simpleDefinition: "A function that remembers its scope.",
    commonMistake: "Thinking it copies the value.",
  },
  {
    _id: "3",
    term: "Promise",
    simpleDefinition: "A future value.",
    commonMistake: "Treating it like the value is already there.",
  },
  {
    _id: "4",
    term: "HTML",
    simpleDefinition: "The structure of a web page.",
    commonMistake: "Using it to style the page.",
  },
];

function sequentialRandom() {
  let i = 0;
  return () => {
    i += 1;
    return (i % 10) / 10;
  };
}

describe("spotGame", () => {
  it("unlocks after four saved cards", () => {
    expect(SPOT_UNLOCK_COUNT).toBe(4);
  });

  it("skips cards without a distinct common-mistake note", () => {
    expect(
      isPlayableSpotTopic({
        _id: "1",
        term: "Recursion",
        simpleDefinition: "A function that calls itself.",
      }),
    ).toBe(false);

    expect(
      isPlayableSpotTopic({
        ...topics[0],
        commonMistake: "A function that calls itself.",
      }),
    ).toBe(false);
  });

  it("skips throwaway test cards", () => {
    expect(
      isPlayableSpotTopic({
        _id: "t",
        term: "test",
        simpleDefinition: "Just checking the app.",
        commonMistake: "A fake mix-up.",
      }),
    ).toBe(false);
  });

  it("builds a four-card round with one mistake and one meaning each", () => {
    const round = buildSpotRound(topics, { random: sequentialRandom() });

    expect(round.cards).toHaveLength(4);
    round.cards.forEach((card) => {
      expect(card.options).toHaveLength(2);
      expect(card.options.map((option) => option.kind).sort()).toEqual([
        "meaning",
        "mistake",
      ]);
    });
  });

  it("returns null when there are not enough cards", () => {
    expect(buildSpotRound(topics.slice(0, 2))).toBeNull();
  });
});
