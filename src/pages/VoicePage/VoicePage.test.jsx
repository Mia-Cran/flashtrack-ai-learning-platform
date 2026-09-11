import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import VoicePage from "./VoicePage";

describe("VoicePage", () => {
  it("shows one pattern and the page names", () => {
    render(<VoicePage />);

    expect(screen.getByRole("heading", { level: 1, name: "Voice" })).toBeInTheDocument();
    expect(screen.getByText("Take me to the ______ page")).toBeInTheDocument();
    expect(screen.getByText("Where is the ______ page?")).toBeInTheDocument();
    expect(screen.getByText("______ page")).toBeInTheDocument();
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Saved Topics")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
  });
});
