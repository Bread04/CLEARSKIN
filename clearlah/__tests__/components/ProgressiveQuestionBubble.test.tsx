import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProgressiveQuestionBubble from "@/components/ui/ProgressiveQuestionBubble";

describe("ProgressiveQuestionBubble", () => {
  it("renders the question text", () => {
    render(
      <ProgressiveQuestionBubble
        question="Do you have any food allergies?"
        onSkip={vi.fn()}
        isVisible={true}
      />
    );

    expect(screen.getByText("Do you have any food allergies?")).toBeInTheDocument();
  });

  it("renders Skip for now button", () => {
    render(
      <ProgressiveQuestionBubble
        question="Test question"
        onSkip={vi.fn()}
        isVisible={true}
      />
    );

    expect(screen.getByRole("button", { name: "Skip for now" })).toBeInTheDocument();
  });

  it("calls onSkip when Skip button clicked", () => {
    const onSkip = vi.fn();
    render(
      <ProgressiveQuestionBubble
        question="Test"
        onSkip={onSkip}
        isVisible={true}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("does not render when isVisible is false", () => {
    render(
      <ProgressiveQuestionBubble
        question="Test"
        onSkip={vi.fn()}
        isVisible={false}
      />
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("has aria-live polite on question text", () => {
    render(
      <ProgressiveQuestionBubble
        question="Test question"
        onSkip={vi.fn()}
        isVisible={true}
      />
    );

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("has minimum 44px touch target on skip button", () => {
    render(
      <ProgressiveQuestionBubble
        question="Test"
        onSkip={vi.fn()}
        isVisible={true}
      />
    );

    const btn = screen.getByRole("button", { name: "Skip for now" });
    expect(btn.className).toMatch(/min-h-\[44px\]/);
  });

  it("animates in with motion-safe class", () => {
    render(
      <ProgressiveQuestionBubble
        question="Test"
        onSkip={vi.fn()}
        isVisible={true}
      />
    );

    const status = screen.getByRole("status");
    expect(status.className).toMatch(/motion-safe/);
  });

  it("uses bubble-ai styling", () => {
    render(
      <ProgressiveQuestionBubble
        question="Test"
        onSkip={vi.fn()}
        isVisible={true}
      />
    );

    const status = screen.getByRole("status");
    expect(status.className).toMatch(/bubble-ai/);
  });
});
