import { describe, it, expect } from "vitest";
import { getSymptomPillarLabel, CONDITION_LABEL_MAP, CONDITION_DISPLAY } from "@/lib/utils/pillars";
import type { Condition } from "@/lib/types/database";

describe("getSymptomPillarLabel", () => {
  it("returns 'Skin Flares' for eczema", () => {
    expect(getSymptomPillarLabel(["eczema"])).toBe("Skin Flares");
  });

  it("returns 'Gut Symptoms' for ibs", () => {
    expect(getSymptomPillarLabel(["ibs"])).toBe("Gut Symptoms");
  });

  it("returns 'Reactions' for food_allergy", () => {
    expect(getSymptomPillarLabel(["food_allergy"])).toBe("Reactions");
  });

  it("returns 'Breathing' for asthma", () => {
    expect(getSymptomPillarLabel(["asthma"])).toBe("Breathing");
  });

  it("returns 'Symptoms' for other condition", () => {
    expect(getSymptomPillarLabel(["other"])).toBe("Symptoms");
  });

  it("returns first condition label when multiple conditions present", () => {
    expect(getSymptomPillarLabel(["eczema", "ibs", "asthma"])).toBe("Skin Flares");
    expect(getSymptomPillarLabel(["asthma", "eczema"])).toBe("Breathing");
  });

  it("returns 'Symptoms' for empty array", () => {
    expect(getSymptomPillarLabel([])).toBe("Symptoms");
  });

  it("handles all valid Condition enum values", () => {
    const allConditions: Condition[] = ["eczema", "ibs", "food_allergy", "asthma", "other"];
    for (const condition of allConditions) {
      const label = getSymptomPillarLabel([condition]);
      expect(label).toBeTruthy();
      expect(typeof label).toBe("string");
    }
  });
});

describe("CONDITION_LABEL_MAP", () => {
  it("has entries for all five conditions", () => {
    const keys = Object.keys(CONDITION_LABEL_MAP);
    expect(keys).toHaveLength(5);
    expect(keys).toContain("eczema");
    expect(keys).toContain("ibs");
    expect(keys).toContain("food_allergy");
    expect(keys).toContain("asthma");
    expect(keys).toContain("other");
  });

  it("every entry has symptomLabel and promptHint strings", () => {
    for (const meta of Object.values(CONDITION_LABEL_MAP)) {
      expect(typeof meta.symptomLabel).toBe("string");
      expect(meta.symptomLabel.length).toBeGreaterThan(0);
      expect(typeof meta.promptHint).toBe("string");
      expect(meta.promptHint.length).toBeGreaterThan(0);
    }
  });
});

describe("CONDITION_DISPLAY", () => {
  it("has five display entries", () => {
    expect(CONDITION_DISPLAY).toHaveLength(5);
  });

  it("every entry has value, label, and subtitle", () => {
    for (const entry of CONDITION_DISPLAY) {
      expect(typeof entry.value).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.subtitle).toBe("string");
      expect(entry.subtitle.length).toBeGreaterThan(0);
    }
  });
});
