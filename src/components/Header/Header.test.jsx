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
    expect(games).toHaveAttribute("href", "/games");
  });

  it("keeps Games active on Match and Spot the mistake", () => {
    render(
      <MemoryRouter initialEntries={["/spot"]}>
        <Header isLoggedIn onSignout={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Games" })).toHaveClass(
      "header__link--active",
    );
  });

  it("hides Games when logged out", () => {
    renderHeader({ isLoggedIn: false });

    expect(screen.queryByRole("link", { name: "Games" })).not.toBeInTheDocument();
  });
});
