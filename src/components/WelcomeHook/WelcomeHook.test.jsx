import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WelcomeHook from "./WelcomeHook";

describe("WelcomeHook", () => {
  it("plays a silent hook and can be paused", async () => {
    const user = userEvent.setup();
    render(<WelcomeHook />);

    expect(
      screen.getByRole("region", { name: "See what FlashTrack feels like" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Type a topic, then tap Search.")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(document.querySelector(".welcome-hook__arrow")).toBeTruthy();

    expect(
      screen.getByRole("button", { name: "Play preview" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Play preview" }),
    );

    expect(
      screen.getByRole("button", { name: "Pause preview" }),
    ).toBeInTheDocument();
  });

  it("shows Hear it on the card without speaking", () => {
    vi.useFakeTimers();
    render(<WelcomeHook />);

    fireEvent.click(screen.getByRole("button", { name: "Play preview" }));

    act(() => {
      vi.advanceTimersByTime(2600 * 2);
    });

    expect(screen.getByText("A study card.")).toBeInTheDocument();
    expect(screen.getByText("Hear it")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hear the preview" }),
    ).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("puts the arrow on Flip when that click plays", () => {
    vi.useFakeTimers();
    render(<WelcomeHook />);

    fireEvent.click(screen.getByRole("button", { name: "Play preview" }));

    act(() => {
      vi.advanceTimersByTime(2600 * 3);
    });

    expect(screen.getByText("The arrow clicks Flip.")).toBeInTheDocument();
    expect(document.querySelector(".welcome-hook__flip--clicking")).toBeTruthy();
    expect(
      document.querySelector(".welcome-hook__flip--clicking .welcome-hook__arrow"),
    ).toBeTruthy();

    vi.useRealTimers();
  });
});
