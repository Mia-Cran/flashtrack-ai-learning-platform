import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import SignupForm from "./SignupForm";

describe("SignupForm", () => {
  it("does not create an account until the 15+ box is checked", async () => {
    const user = userEvent.setup();
    const onSignup = vi.fn(() => Promise.resolve());
    render(
      <MemoryRouter>
        <SignupForm onSignup={onSignup} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "Read the Legal page" }),
    ).toHaveAttribute("href", "/legal");

    await user.type(screen.getByPlaceholderText("Name"), "Maria");
    await user.type(screen.getByPlaceholderText("Email"), "maria@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(onSignup).not.toHaveBeenCalled();

    await user.click(screen.getByRole("checkbox", { name: "I am 15 or older" }));
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(onSignup).toHaveBeenCalledWith("Maria", "maria@example.com", "secret123", true);
  });
});
