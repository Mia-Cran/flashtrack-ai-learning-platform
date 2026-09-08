import { describe, it, expect } from "vitest";
import {
  isPlaceholderQuestionText,
  optionsLookLikeLettersOnly,
  quizHasUnusableQuestions,
} from "./quizQuality";

describe("quizQuality", () => {
  it("flags Q1? and letter-only options", () => {
    expect(isPlaceholderQuestionText("Q1?")).toBe(true);
    expect(optionsLookLikeLettersOnly(["A", "B", "C", "D"])).toBe(true);
    expect(
      quizHasUnusableQuestions([
        { text: "What is recursion?", options: ["A", "B", "C", "D"] },
      ]),
    ).toBe(true);
  });

  it("allows real questions", () => {
    expect(
      quizHasUnusableQuestions([
        {
          text: "What calls itself?",
          options: ["A function", "A loop", "A class", "A file"],
        },
      ]),
    ).toBe(false);
  });
});
