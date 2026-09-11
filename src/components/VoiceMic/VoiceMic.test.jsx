import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import VoiceMic from "./VoiceMic";

const navigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

class FakeRecognition {
  static instance = null;

  constructor() {
    FakeRecognition.instance = this;
    this.lang = "";
    this.interimResults = false;
    this.maxAlternatives = 1;
    this.continuous = false;
  }

  start() {
    this.onstart?.();
  }

  stop() {
    this.onend?.();
  }
}

function renderMic() {
  return render(
    <MemoryRouter>
      <VoiceMic />
    </MemoryRouter>,
  );
}

describe("VoiceMic", () => {
  beforeEach(() => {
    navigate.mockReset();
    FakeRecognition.instance = null;
    window.webkitSpeechRecognition = FakeRecognition;
  });

  afterEach(() => {
    delete window.webkitSpeechRecognition;
    delete window.SpeechRecognition;
  });

  it("starts listening and goes to Saved Topics", async () => {
    const user = userEvent.setup();
    renderMic();

    await user.click(screen.getByRole("button", { name: "Nova" }));

    expect(screen.getByRole("button", { name: "Stop listening" })).toBeInTheDocument();
    expect(screen.getByText("Listening…")).toBeInTheDocument();

    act(() => {
      FakeRecognition.instance.onresult({
        results: [[{ transcript: "where are my saved topics" }]],
      });
      FakeRecognition.instance.onend();
    });

    expect(navigate).toHaveBeenCalledWith("/saved");
    expect(screen.getByText("Going to Saved Topics")).toBeInTheDocument();
  });

  it("searches a spoken topic", async () => {
    const user = userEvent.setup();
    renderMic();

    await user.click(screen.getByRole("button", { name: "Nova" }));
    act(() => {
      FakeRecognition.instance.onresult({
        results: [[{ transcript: "search photosynthesis" }]],
      });
    });

    expect(navigate).toHaveBeenCalledWith("/search", {
      state: { searchTerm: "photosynthesis" },
    });
  });

  it("does not navigate on junk", async () => {
    const user = userEvent.setup();
    renderMic();

    await user.click(screen.getByRole("button", { name: "Nova" }));
    act(() => {
      FakeRecognition.instance.onresult({
        results: [[{ transcript: "hello" }]],
      });
    });

    expect(navigate).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          "Didn't catch that. Try Hey Nova, take me to the Search page.",
        ),
      ).toBeInTheDocument();
  });

  it("takes 'where are my topics' to Saved Topics", async () => {
    const user = userEvent.setup();
    renderMic();

    await user.click(screen.getByRole("button", { name: "Nova" }));
    act(() => {
      FakeRecognition.instance.onresult({
        results: [[{ transcript: "where are my topics" }]],
      });
    });

    expect(navigate).toHaveBeenCalledWith("/saved");
  });

  it("links to the Voice phrases page", () => {
    renderMic();

    expect(screen.getByRole("link", { name: "What can I say?" })).toHaveAttribute(
      "href",
      "/voice",
    );
  });
});
