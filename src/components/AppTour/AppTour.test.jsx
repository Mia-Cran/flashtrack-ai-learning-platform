import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import AppTour from "./AppTour";
import { getTourSteps } from "./tourSteps";

function Host({ isLoggedIn }) {
  const steps = getTourSteps(isLoggedIn);
  const [index, setIndex] = useState(0);

  return (
    <>
      <a href="/search" data-tour="search">
        Search
      </a>
      <a href="/feedback" data-tour="feedback">
        Feedback
      </a>
      {index !== null && (
        <AppTour
          steps={steps}
          stepIndex={index}
          onNext={() =>
            setIndex((current) =>
              current >= steps.length - 1 ? null : current + 1,
            )
          }
          onSkip={() => setIndex(null)}
        />
      )}
    </>
  );
}

describe("AppTour", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("uses a short logged-out path and a longer logged-in path", () => {
    expect(getTourSteps(false).map((step) => step.id)).toEqual([
      "search",
      "feedback",
    ]);
    expect(getTourSteps(true).map((step) => step.id)).toEqual([
      "search",
      "saved",
      "games",
      "home",
      "settings",
    ]);
  });

  it("lets the learner leave on every step", async () => {
    const user = userEvent.setup();
    render(<Host isLoggedIn={false} />);

    expect(screen.getByRole("dialog", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByText("1 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "I'm done" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
