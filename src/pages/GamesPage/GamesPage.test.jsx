import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import GamesPage from "./GamesPage";

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

function renderGames(savedTopics = topics) {
  return render(
    <MemoryRouter>
      <GamesPage isLoggedIn savedTopics={savedTopics} />
    </MemoryRouter>,
  );
}

describe("GamesPage", () => {
  it("links to Match and Spot the mistake when enough cards are saved", () => {
    renderGames();

    expect(screen.getByRole("link", { name: "Play Match" })).toHaveAttribute(
      "href",
      "/match",
    );
    expect(
      screen.getByRole("link", { name: "Play Spot the mistake" }),
    ).toHaveAttribute("href", "/spot");
  });

  it("keeps both games locked until four playable cards are saved", () => {
    renderGames(topics.slice(0, 2));

    expect(screen.queryByRole("link", { name: "Play Match" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Play Spot the mistake" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/You have 2 ready/)).toHaveLength(2);
  });
});
