import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import LegalPage from "./LegalPage";

describe("LegalPage", () => {
  it("states the 15+ line and that cards are AI-written", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Legal" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/15 and older/i)).toBeInTheDocument();
    expect(screen.getByText(/do not check IDs/i)).toBeInTheDocument();
    expect(screen.getAllByText(/OpenAI/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Feedback" })).toHaveAttribute(
      "href",
      "/feedback",
    );
  });
});
