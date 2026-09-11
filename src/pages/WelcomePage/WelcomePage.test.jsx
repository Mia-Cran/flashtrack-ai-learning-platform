import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import WelcomePage from "./WelcomePage";

describe("WelcomePage", () => {
  it("mentions Nova without a phrase list", () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Tap Nova and say Hey Nova, take me to the Search page/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Hey Nova, take me to the ______ page"),
    ).not.toBeInTheDocument();
  });
});
