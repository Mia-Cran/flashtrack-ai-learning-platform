import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Header from "./Header";

function renderHeader(props) {
  return render(
    <MemoryRouter>
      <Header onSignout={vi.fn()} {...props} />
    </MemoryRouter>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  it("shows Games in the nav when logged in", () => {
    renderHeader({ isLoggedIn: true });

    const games = screen.getByRole("link", { name: "Games" });
    expect(games).toHaveAttribute("href", "/match");
  });

  it("hides Games when logged out", () => {
    renderHeader({ isLoggedIn: false });

    expect(screen.queryByRole("link", { name: "Games" })).not.toBeInTheDocument();
  });
});
