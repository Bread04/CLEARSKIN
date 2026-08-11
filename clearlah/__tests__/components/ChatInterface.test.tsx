import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatInterface from "@/components/ui/ChatInterface";

const baseProps = {
  trackingFor: "myself",
  conditions: ["eczema"],
  singlishUnlocked: false,
  logCount: 0,
  onboardingStep: 3,
  knownAllergens: [],
  dailySkincare: null,
};

describe("ChatInterface", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-10T14:00:00+08:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the input and send button", () => {
    render(<ChatInterface {...baseProps} />);

    expect(
      screen.getByPlaceholderText("Describe your day...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send message" })
    ).toBeInTheDocument();
  });

  it("shows adaptive greeting on mount (Tier 1 — formal, Day 0)", () => {
    render(<ChatInterface {...baseProps} logCount={0} />);

    expect(
      screen.getByText(/Tell me how your day has been/)
    ).toBeInTheDocument();
  });

  it("shows casual greeting for Day 4+ (Tier 2)", () => {
    render(<ChatInterface {...baseProps} logCount={4} />);

    expect(screen.getByText(/How was today/)).toBeInTheDocument();
  });

  it("shows Singlish greeting when unlocked and 3+ logs (Tier 3)", () => {
    render(
      <ChatInterface {...baseProps} logCount={4} singlishUnlocked={true} />
    );

    expect(screen.getByText(/Eh, how was today ah/)).toBeInTheDocument();
  });

  it("includes time-of-day prefix in greeting", () => {
    vi.setSystemTime(new Date("2026-08-10T09:00:00+08:00"));
    render(<ChatInterface {...baseProps} logCount={0} />);

    expect(screen.getByText(/Good morning/)).toBeInTheDocument();
  });

  it("user message appears as user bubble", async () => {
    render(<ChatInterface {...baseProps} />);

    const input = screen.getByPlaceholderText("Describe your day...");
    fireEvent.change(input, { target: { value: "Had laksa today" } });

    const sendBtn = screen.getByRole("button", { name: "Send message" });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText("Had laksa today")).toBeInTheDocument();
    });
  });

  it("shows skeleton bubble while processing", async () => {
    render(<ChatInterface {...baseProps} />);

    const input = screen.getByPlaceholderText("Describe your day...");
    fireEvent.change(input, { target: { value: "Hello" } });

    const sendBtn = screen.getByRole("button", { name: "Send message" });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      const skeleton = document.querySelector(".skeleton");
      expect(skeleton).toBeInTheDocument();
    });
  });

  it("disables input while processing", async () => {
    render(<ChatInterface {...baseProps} />);

    const input = screen.getByPlaceholderText(
      "Describe your day..."
    ) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "Hello" } });

    const sendBtn = screen.getByRole("button", { name: "Send message" });
    fireEvent.click(sendBtn);

    expect(input).toBeDisabled();
  });

  it("Enter key submits message", () => {
    render(<ChatInterface {...baseProps} />);

    const input = screen.getByPlaceholderText("Describe your day...");
    fireEvent.change(input, { target: { value: "Test enter" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });

    expect(screen.getByText("Test enter")).toBeInTheDocument();
  });

  it("Shift+Enter does not submit", () => {
    render(<ChatInterface {...baseProps} />);

    const input = screen.getByPlaceholderText("Describe your day...");
    fireEvent.change(input, { target: { value: "Should not send" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    const bubbles = document.querySelectorAll(".bubble-user");
    const bubbleTexts = Array.from(bubbles).map((b) => b.textContent);
    expect(bubbleTexts).not.toContain("Should not send");
  });

  it("send button disabled when input empty", () => {
    render(<ChatInterface {...baseProps} />);

    const sendBtn = screen.getByRole("button", { name: "Send message" });
    expect(sendBtn).toBeDisabled();
  });

  it("has aria-live region", () => {
    render(<ChatInterface {...baseProps} />);

    expect(screen.getByRole("log")).toHaveAttribute("aria-live", "polite");
  });

  it("send button has correct aria-label", () => {
    render(<ChatInterface {...baseProps} />);

    expect(
      screen.getByRole("button", { name: "Send message" })
    ).toBeInTheDocument();
  });

  it("send button has 44x44px touch target", () => {
    render(<ChatInterface {...baseProps} />);

    const sendBtn = screen.getByRole("button", { name: "Send message" });
    expect(sendBtn.className).toMatch(/min-w-\[44px\]/);
    expect(sendBtn.className).toMatch(/min-h-\[44px\]/);
  });

  it("AI bubbles use bubble-ai class", () => {
    render(<ChatInterface {...baseProps} logCount={0} />);

    const aiBubble = screen.getByText(/Tell me how your day has been/);
    expect(aiBubble.className).toMatch(/bubble-ai/);
  });

  it("user bubbles use bubble-user class", async () => {
    render(<ChatInterface {...baseProps} />);

    const input = screen.getByPlaceholderText("Describe your day...");
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      const userBubble = screen.getByText("Test message");
      expect(userBubble.className).toMatch(/bubble-user/);
    });
  });

  describe("integration — location permission bubble", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("shows location bubble on Day 1 (logCount 0) when not asked", () => {
      render(<ChatInterface {...baseProps} logCount={0} />);
      expect(screen.getByText(/can I access your location/i)).toBeInTheDocument();
    });

    it("does not show location bubble when already asked", () => {
      localStorage.setItem("clearlah_location_permission_asked", "true");
      render(<ChatInterface {...baseProps} logCount={0} />);
      expect(screen.queryByText(/can I access your location/i)).not.toBeInTheDocument();
    });

    it("does not show location bubble when logCount > 0", () => {
      render(<ChatInterface {...baseProps} logCount={1} />);
      expect(screen.queryByText(/can I access your location/i)).not.toBeInTheDocument();
    });
  });

  describe("integration — progressive questions", () => {
    it("shows Day 2 allergen question when onboardingStep is 1 and logCount > 0", () => {
      render(
        <ChatInterface {...baseProps} logCount={1} onboardingStep={1} />
      );
      expect(screen.getByText(/food allergies or sensitivities/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Skip for now" })).toBeInTheDocument();
    });

    it("shows Day 3 skincare question when onboardingStep is 2 and logCount > 0", () => {
      render(
        <ChatInterface {...baseProps} logCount={2} onboardingStep={2} />
      );
      expect(screen.getByText(/skincare products/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Skip for now" })).toBeInTheDocument();
    });

    it("does not show progressive question when onboardingStep is 3", () => {
      render(
        <ChatInterface {...baseProps} logCount={5} onboardingStep={3} />
      );
      expect(screen.queryByText(/food allergies/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/skincare products/i)).not.toBeInTheDocument();
    });

    it("changes placeholder for allergen mode", () => {
      render(
        <ChatInterface {...baseProps} logCount={1} onboardingStep={1} />
      );
      expect(
        screen.getByPlaceholderText(/shellfish, peanuts/i)
      ).toBeInTheDocument();
    });

    it("changes placeholder for skincare mode", () => {
      render(
        <ChatInterface {...baseProps} logCount={2} onboardingStep={2} />
      );
      expect(
        screen.getByPlaceholderText(/cetaphil cleanser/i)
      ).toBeInTheDocument();
    });
  });
});
