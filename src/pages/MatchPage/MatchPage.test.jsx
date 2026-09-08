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
      <MatchPage isLoggedIn savedTopics={savedTopics} />
    </MemoryRouter>,
  );
}

describe("MatchPage", () => {
  it("asks the learner to save more cards when they have fewer than four", () => {
    renderMatch(topics.slice(0, 2));

    expect(
      screen.getByText(/Save 4 real flashcards to play Match/),
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

  it("starts a new round from New round without finishing first", async () => {
    const user = userEvent.setup();
    renderMatch();

    await user.click(screen.getByRole("button", { name: "Term: Recursion" }));
    await user.click(
      screen.getByRole("button", {
        name: "Meaning: A function that calls itself.",
      }),
    );

    expect(screen.getByText("1 of 4 matched")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New round" }));

    expect(screen.getByText("0 of 4 matched")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Term: Recursion" }),
    ).not.toBeDisabled();
  });

  it("does not put throwaway test cards on the board", () => {
    renderMatch([
      ...topics,
      { _id: "t", term: "test", simpleDefinition: "Just checking the app." },
    ]);

    expect(
      screen.queryByRole("button", { name: "Term: test" }),
    ).not.toBeInTheDocument();
  });
});
