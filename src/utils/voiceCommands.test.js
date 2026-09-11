import { describe, it, expect } from "vitest";
import { parseVoiceCommand, VOICE_PHRASE_GROUPS } from "./voiceCommands";

describe("parseVoiceCommand", () => {
  it("opens a page for every phrase listed on the Voice page", () => {
    VOICE_PHRASE_GROUPS.forEach((group) => {
      [...group.phrases.en, ...group.phrases.es].forEach((phrase) => {
        const command = parseVoiceCommand(phrase);
        expect(command, phrase).toMatchObject({
          type: "navigate",
          path: group.path,
        });
      });
    });
  });

  it("takes the four v1 commands to the right pages", () => {
    expect(parseVoiceCommand("saved topics").path).toBe("/saved");
    expect(parseVoiceCommand("where are my topics").path).toBe("/saved");
    expect(parseVoiceCommand("games").path).toBe("/games");
    expect(parseVoiceCommand("go home").path).toBe("/home");
    expect(parseVoiceCommand("search").path).toBe("/search");
  });

  it("treats search page and search box as Search, not a topic", () => {
    expect(parseVoiceCommand("take me to the search page")).toEqual({
      type: "navigate",
      path: "/search",
      cueKey: "voice.goingSearch",
    });
    expect(parseVoiceCommand("where is the search page?")).toEqual({
      type: "navigate",
      path: "/search",
      cueKey: "voice.goingSearch",
    });
    expect(parseVoiceCommand("where is the saved topics page?")).toEqual({
      type: "navigate",
      path: "/saved",
      cueKey: "voice.goingSaved",
    });
    expect(parseVoiceCommand("Welcome page")).toEqual({
      type: "navigate",
      path: "/",
      cueKey: "voice.goingWelcome",
    });
    expect(parseVoiceCommand("Saved Topics page")).toEqual({
      type: "navigate",
      path: "/saved",
      cueKey: "voice.goingSaved",
    });
    expect(parseVoiceCommand("take me to the search box")).toEqual({
      type: "navigate",
      path: "/search",
      cueKey: "voice.goingSearch",
    });
    expect(parseVoiceCommand("where is the homepage")).toEqual({
      type: "navigate",
      path: "/home",
      cueKey: "voice.goingHome",
    });
    expect(parseVoiceCommand("where is the home page")).toEqual({
      type: "navigate",
      path: "/home",
      cueKey: "voice.goingHome",
    });
  });

  it("lets you address Nova by name", () => {
    expect(parseVoiceCommand("hey nova take me to the search page")).toEqual({
      type: "navigate",
      path: "/search",
      cueKey: "voice.goingSearch",
    });
    expect(parseVoiceCommand("hey nova, where is the home page?")).toEqual({
      type: "navigate",
      path: "/home",
      cueKey: "voice.goingHome",
    });
    expect(parseVoiceCommand("nova search photosynthesis")).toEqual({
      type: "search",
      term: "photosynthesis",
    });
    expect(parseVoiceCommand("oye nova llévame a la página de juegos")).toEqual({
      type: "navigate",
      path: "/games",
      cueKey: "voice.goingGames",
    });
    expect(parseVoiceCommand("take me to nova").path).toBe("/voice");
    expect(parseVoiceCommand("hey nova")).toBeNull();
  });

  it("sends a topic to Search", () => {
    expect(parseVoiceCommand("search photosynthesis")).toEqual({
      type: "search",
      term: "photosynthesis",
    });
    expect(parseVoiceCommand("look up mitosis")).toEqual({
      type: "search",
      term: "mitosis",
    });
  });

  it("does not treat homework as home", () => {
    expect(parseVoiceCommand("homework")).toBeNull();
  });

  it("ignores empty talk and fillers", () => {
    expect(parseVoiceCommand("")).toBeNull();
    expect(parseVoiceCommand("hello")).toBeNull();
  });
});
