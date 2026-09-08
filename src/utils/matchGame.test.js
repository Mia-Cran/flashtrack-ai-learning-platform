import { describe, it, expect } from "vitest";
import {
  MATCH_UNLOCK_COUNT,
  buildMatchRound,
  promptForTopic,
  shuffleList,
} from "./matchGame";

const topics = [
  {
    _id: "1",
    term: "Recursion",
    simpleDefinition: "A function that calls itself.",
    technicalDefinition: "A process defined in terms of itself.",
    analogy: "Like nested Russian dolls.",
  },
  {
    _id: "2",
    term: "Closure",
    simpleDefinition: "A function that remembers its scope.",
    technicalDefinition: "A function bundled with its lexical environment.",
    analogy: "A backpack of variables.",
  },
  {
    _id: "3",
    term: "Promise",
    simpleDefinition: "A future value.",
    technicalDefinition: "An object representing eventual completion.",
    analogy: "A rain check.",
  },
  {
    _id: "4",
    term: "HTML",
    simpleDefinition: "The structure of a web page.",
    technicalDefinition: "A markup language for documents.",
    analogy: "The skeleton of a house.",
  },
];

function sequentialRandom() {
  let i = 0;
  return () => {
    i += 1;
    return (i % 10) / 10;
  };
}

describe("matchGame", () => {
  it("unlocks after four saved cards", () => {
    expect(MATCH_UNLOCK_COUNT).toBe(4);
  });

  it("uses analogy text when explanationStyle is analogies", () => {
    expect(promptForTopic(topics[0], "analogies")).toBe(
      "Like nested Russian dolls.",
    );
  });

  it("uses the technical definition when explanationStyle is technical", () => {
    expect(promptForTopic(topics[0], "technical")).toBe(
      "A process defined in terms of itself.",
    );
  });

  it("builds a four-pair round with matching ids on both sides", () => {
    const round = buildMatchRound(topics, "straight", {
      random: sequentialRandom(),
    });

    expect(round.terms).toHaveLength(4);
    expect(round.prompts).toHaveLength(4);

    const termIds = round.terms.map((tile) => tile.id).sort();
    const promptIds = round.prompts.map((tile) => tile.id).sort();
    expect(termIds).toEqual(promptIds);
  });

  it("returns null when there are not enough cards", () => {
    expect(buildMatchRound(topics.slice(0, 2), "straight")).toBeNull();
  });

  it("shuffles without dropping items", () => {
    expect(shuffleList(["a", "b", "c"], sequentialRandom()).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
