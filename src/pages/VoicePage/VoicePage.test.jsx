import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import VoicePage from "./VoicePage";

describe("VoicePage", () => {
  it("shows one pattern and the page names", () => {
    render(<VoicePage />);

    expect(screen.getByRole("heading", { level: 1, name: "Nova" })).toBeInTheDocument();
    expect(
      screen.getByText("Hey Nova, take me to the ______ page"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hey Nova, where is the ______ page?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Hey Nova, ______ page")).toBeInTheDocument();
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Saved Topics")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
  });
});
