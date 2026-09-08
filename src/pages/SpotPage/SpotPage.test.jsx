import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import SpotPage from "./SpotPage";

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

function renderSpot(savedTopics = topics) {
  return render(
    <MemoryRouter>
      <SpotPage isLoggedIn savedTopics={savedTopics} />
    </MemoryRouter>,
  );
}

function visibleTopic() {
  return topics.find((topic) =>
    screen.queryByText(topic.term, { selector: ".spot-page__term" }),
  );
}

describe("SpotPage", () => {
  it("asks the learner to save more cards when they have fewer than four", () => {
    renderSpot(topics.slice(0, 2));

    expect(
      screen.getByText(/Save 4 real flashcards to play Spot the mistake/),
    ).toBeInTheDocument();
  });

  it("spots the common mix-up and lets a miss be tried again", async () => {
    const user = userEvent.setup();
    renderSpot();

    const topic = visibleTopic();
    const meaning = screen.getByRole("button", {
      name: `Option: ${topic.simpleDefinition}`,
    });
    const mistake = screen.getByRole("button", {
      name: `Option: ${topic.commonMistake}`,
    });

    await user.click(meaning);
    expect(screen.getByText(/That's the real meaning/)).toBeInTheDocument();
    expect(meaning).not.toBeDisabled();

    await user.click(mistake);
    expect(screen.getByText(/Spotted it/)).toBeInTheDocument();
    expect(screen.getByText("1 of 4 spotted")).toBeInTheDocument();
    expect(mistake).toBeDisabled();
  });

  it("moves to the next term after a spot", async () => {
    const user = userEvent.setup();
    renderSpot();

    const firstTerm = visibleTopic().term;
    await user.click(
      screen.getByRole("button", {
        name: `Option: ${visibleTopic().commonMistake}`,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Next term" }));

    expect(screen.getByText("1 of 4 spotted")).toBeInTheDocument();
    expect(
      screen.queryByText(firstTerm, { selector: ".spot-page__term" }),
    ).not.toBeInTheDocument();
  });

  it("does not put throwaway test cards in the round", () => {
    renderSpot([
      ...topics,
      {
        _id: "t",
        term: "test",
        simpleDefinition: "Just checking the app.",
        commonMistake: "A fake mix-up.",
      },
    ]);

    expect(screen.queryByText("test")).not.toBeInTheDocument();
  });
});
