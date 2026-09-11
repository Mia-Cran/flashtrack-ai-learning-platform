import { describe, it, expect } from "vitest";
import { pickVoice } from "./speech";

describe("pickVoice", () => {
  it("prefers a natural English voice over novelty ones", () => {
    const zarvox = { name: "Zarvox", lang: "en-US", localService: true };
    const samantha = { name: "Samantha", lang: "en-US", localService: true };

    expect(pickVoice("en-US", [zarvox, samantha])).toEqual(samantha);
  });

  it("prefers a Spanish voice when the language is Spanish", () => {
    const samantha = { name: "Samantha", lang: "en-US", localService: true };
    const paulina = { name: "Paulina", lang: "es-MX", localService: true };

    expect(pickVoice("es-ES", [samantha, paulina])).toEqual(paulina);
  });
});
