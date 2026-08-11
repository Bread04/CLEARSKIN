import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InsightCard from "@/components/insights/InsightCard";

describe("InsightCard", () => {
  const baseProps = {
    trigger: "Shellfish",
    pillar: "food" as const,
    confidence: 74,
    narration: "Shellfish appeared on 9 of your flare days.",
    affectedDays: ["2026-08-01", "2026-08-03", "2026-08-05", "2026-08-07", "2026-08-09"],
    index: 0,
  };

  it("renders the trigger name", () => {
    render(<InsightCard {...baseProps} />);
    expect(screen.getByText("Shellfish")).toBeDefined();
  });

  it("renders the confidence percentage", () => {
    render(<InsightCard {...baseProps} />);
    expect(screen.getByText("74%")).toBeDefined();
  });

  it("renders the narration text", () => {
    render(<InsightCard {...baseProps} />);
    expect(screen.getByText("Shellfish appeared on 9 of your flare days.")).toBeDefined();
  });

  it("shows AI Analysis badge", () => {
    render(<InsightCard {...baseProps} />);
    expect(screen.getByText("AI Analysis")).toBeDefined();
  });

  it("toggles evidence section on click", () => {
    render(<InsightCard {...baseProps} />);
    const toggle = screen.getByText("See evidence");
    expect(toggle).toBeDefined();

    fireEvent.click(toggle);
    expect(screen.getByText("Hide evidence")).toBeDefined();

    fireEvent.click(screen.getByText("Hide evidence"));
    expect(screen.getByText("See evidence")).toBeDefined();
  });

  it("shows affected dates in evidence section", () => {
    render(<InsightCard {...baseProps} />);
    fireEvent.click(screen.getByText("See evidence"));
    expect(screen.getByText(/1 Aug/)).toBeDefined();
    expect(screen.getByText(/3 Aug/)).toBeDefined();
    expect(screen.getByText(/5 Aug/)).toBeDefined();
  });

  it("renders pillar tag", () => {
    render(<InsightCard {...baseProps} />);
    expect(screen.getByText("food")).toBeDefined();
  });
});
