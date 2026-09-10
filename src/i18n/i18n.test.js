import { describe, it, expect } from "vitest";
import { normalizeLanguage, translate, translateSubjectName } from "./index";

describe("i18n", () => {
  it("treats anything but es as English", () => {
    expect(normalizeLanguage("es")).toBe("es");
    expect(normalizeLanguage("en")).toBe("en");
    expect(normalizeLanguage(undefined)).toBe("en");
  });

  it("returns Spanish chrome and interpolates", () => {
    expect(translate("es", "header.games")).toBe("Juegos");
    expect(translate("es", "welcome.back", { name: "Maria" })).toBe(
      "¡Hola de nuevo, Maria!",
    );
  });

  it("translates seeded subject names", () => {
    expect(translateSubjectName("es", "Mathematics")).toBe("Matemáticas");
    expect(translateSubjectName("en", "Mathematics")).toBe("Mathematics");
  });

  it("keeps English game copy that tests rely on", () => {
    expect(translate("en", "header.games")).toBe("Games");
    expect(translate("en", "games.playMatch")).toBe("Play Match");
    expect(
      translate("en", "hear.needMore", { need: 4, have: 1 }),
    ).toMatch(/Save 4 real flashcards to play Hear & pick/);
  });
});
