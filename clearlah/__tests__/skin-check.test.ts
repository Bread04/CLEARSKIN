import { describe, it, expect } from "vitest";
import {
  classifySeverity,
  buildTriage,
  clampScore,
} from "@/lib/skin-check";

describe("classifySeverity", () => {
  it("maps low scores to clear/mild", () => {
    expect(classifySeverity(0)).toBe("clear");
    expect(classifySeverity(1)).toBe("clear");
    expect(classifySeverity(2)).toBe("mild");
    expect(classifySeverity(3)).toBe("mild");
  });

  it("maps mid scores to moderate", () => {
    expect(classifySeverity(4)).toBe("moderate");
    expect(classifySeverity(6)).toBe("moderate");
  });

  it("maps high scores to severe", () => {
    expect(classifySeverity(7)).toBe("severe");
    expect(classifySeverity(10)).toBe("severe");
  });
});

describe("buildTriage", () => {
  it("does not escalate for a moderate, non-urgent score", () => {
    const result = buildTriage(5, ["redness", "dryness"]);
    expect(result.escalate).toBe(false);
    expect(result.escalationReason).toBeNull();
    expect(result.selfCare.length).toBeGreaterThan(0);
  });

  it("escalates for a severe score", () => {
    const result = buildTriage(9, ["redness"]);
    expect(result.escalate).toBe(true);
    expect(result.escalationReason).not.toBeNull();
  });

  it("escalates on urgent indicators even at a lower score", () => {
    const result = buildTriage(4, ["weeping", "redness"]);
    expect(result.escalate).toBe(true);
  });

  it("escalates at the severe threshold (score 7)", () => {
    const result = buildTriage(7, ["redness"]);
    expect(result.escalate).toBe(true);
  });

  it("does not escalate on benign indicators containing urgent substrings", () => {
    const result = buildTriage(5, ["pustular", "redness"]);
    expect(result.escalate).toBe(false);
  });

  it("provides a different reason for urgent indicators vs. severity alone", () => {
    const urgent = buildTriage(4, ["crusting"]);
    const severe = buildTriage(9, []);
    expect(urgent.escalationReason).not.toBe(severe.escalationReason);
  });
});

describe("clampScore", () => {
  it("clamps into the 0-10 range", () => {
    expect(clampScore(-3)).toBe(0);
    expect(clampScore(42)).toBe(10);
  });

  it("rounds to one decimal place", () => {
    expect(clampScore(5.55)).toBe(5.6);
    expect(clampScore(5.54)).toBe(5.5);
  });
});
