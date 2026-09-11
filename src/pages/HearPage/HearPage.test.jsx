import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import HearPage from "./HearPage";

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

function renderHear(savedTopics = topics) {
  return render(
    <MemoryRouter>
      <HearPage isLoggedIn savedTopics={savedTopics} />
    </MemoryRouter>,
  );
}

function visibleTopic() {
  return topics.find((topic) =>
    screen.queryByText(topic.term, { selector: ".hear-page__term" }),
  );
}

describe("HearPage", () => {
  it("asks the learner to save more cards when they have fewer than four", () => {
    renderHear(topics.slice(0, 2));

    expect(
      screen.getByText(/Save 4 real flashcards to play Hear & pick/),
    ).toBeInTheDocument();
  });

  it("picks the matching meaning and lets a miss be tried again", async () => {
    const user = userEvent.setup();
    renderHear();

    const topic = visibleTopic();
    const correct = screen.getByRole("button", {
      name: `Meaning: ${topic.simpleDefinition}`,
    });
    const wrong = topics.find((item) => item._id !== topic._id);

    await user.click(
      screen.getByRole("button", {
        name: `Meaning: ${wrong.simpleDefinition}`,
      }),
    );
    expect(screen.getByText(/Not that one/)).toBeInTheDocument();
    expect(correct).not.toBeDisabled();

    await user.click(correct);
    expect(screen.getByText(new RegExp(`That's ${topic.term}`))).toBeInTheDocument();
    expect(screen.getByText("1 of 4 picked")).toBeInTheDocument();
    expect(correct).toBeDisabled();
  });

  it("moves to the next term after a pick", async () => {
    const user = userEvent.setup();
    renderHear();

    const firstTerm = visibleTopic().term;
    await user.click(
      screen.getByRole("button", {
        name: `Meaning: ${visibleTopic().simpleDefinition}`,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Next term" }));

    expect(screen.getByText("1 of 4 picked")).toBeInTheDocument();
    expect(
      screen.queryByText(firstTerm, { selector: ".hear-page__term" }),
    ).not.toBeInTheDocument();
  });

  it("does not put throwaway test cards in the round", () => {
    renderHear([
      ...topics,
      { _id: "t", term: "test", simpleDefinition: "Just checking the app." },
    ]);

    expect(
      screen.queryByRole("button", { name: "Meaning: Just checking the app." }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("test", { selector: ".hear-page__term" }),
    ).not.toBeInTheDocument();
  });
});
