import { describe, it, expect } from "vitest";
import { HEAR_UNLOCK_COUNT, buildHearRound } from "./hearGame";

const topics = [
  {
    _id: "1",
    term: "Recursion",
    simpleDefinition: "A function that calls itself.",
  },
  {
    _id: "2",
    term: "Closure",
    simpleDefinition: "A function that remembers its scope.",
  },
  {
    _id: "3",
    term: "Promise",
    simpleDefinition: "A future value.",
  },
  {
    _id: "4",
    term: "HTML",
    simpleDefinition: "The structure of a web page.",
  },
];

function sequentialRandom() {
  let i = 0;
  return () => {
    i += 1;
    return (i % 10) / 10;
  };
}

describe("hearGame", () => {
  it("unlocks after four saved cards", () => {
    expect(HEAR_UNLOCK_COUNT).toBe(4);
  });

  it("builds a four-card round with four meaning options each", () => {
    const round = buildHearRound(topics, { random: sequentialRandom() });

    expect(round.cards).toHaveLength(4);
    round.cards.forEach((card) => {
      expect(card.options).toHaveLength(4);
      expect(card.options.map((option) => option.id).sort()).toEqual(
        round.cards.map((item) => item.id).sort(),
      );
      expect(card.spoken).toBe(card.term);
    });
  });

  it("skips throwaway test cards", () => {
    const round = buildHearRound(
      [
        ...topics,
        { _id: "t", term: "test", simpleDefinition: "A throwaway save." },
      ],
      { random: sequentialRandom() },
    );

    expect(round.cards.map((card) => card.term)).not.toContain("test");
  });

  it("returns null when there are not enough cards", () => {
    expect(buildHearRound(topics.slice(0, 2))).toBeNull();
  });
});
