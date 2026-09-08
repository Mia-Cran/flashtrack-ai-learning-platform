import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import MatchPage from "./MatchPage";

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

function renderMatch(savedTopics = topics) {
  return render(
    <MemoryRouter>
      <MatchPage
        isLoggedIn
        savedTopics={savedTopics}
        explanationStyle="straight"
      />
    </MemoryRouter>,
  );
}

describe("MatchPage", () => {
  it("asks the learner to save more cards when they have fewer than four", () => {
    renderMatch(topics.slice(0, 2));

    expect(
      screen.getByText(/Save 4 flashcards to play Match/),
    ).toBeInTheDocument();
  });

  it("matches a term to its meaning", async () => {
    const user = userEvent.setup();
    renderMatch();

    await user.click(screen.getByRole("button", { name: "Term: Recursion" }));
    await user.click(
      screen.getByRole("button", {
        name: "Meaning: A function that calls itself.",
      }),
    );

    expect(screen.getByText(/Matched/)).toBeInTheDocument();
    expect(screen.getByText("1 of 4 matched")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Term: Recursion" }),
    ).toBeDisabled();
  });

  it("lets a wrong pair be tried again without locking the tiles", async () => {
    const user = userEvent.setup();
    renderMatch();

    await user.click(screen.getByRole("button", { name: "Term: Recursion" }));
    await user.click(
      screen.getByRole("button", {
        name: "Meaning: A future value.",
      }),
    );

    expect(screen.getByText(/Not a match/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Term: Recursion" }),
    ).not.toBeDisabled();
  });
});
