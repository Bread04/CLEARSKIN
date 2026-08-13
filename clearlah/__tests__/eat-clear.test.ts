import { describe, it, expect } from "vitest";
import { getFoodsToEat, getAllSkinFoods } from "@/lib/eat-clear";

describe("getFoodsToEat", () => {
  it("returns all curated foods when there are no allergens or triggers", () => {
    const result = getFoodsToEat([], []);
    expect(result).toHaveLength(getAllSkinFoods().length);
  });

  it("excludes foods containing a known allergen category", () => {
    const result = getFoodsToEat(["fish"], []);
    const nutrients = result.map((f) => f.nutrient);
    expect(nutrients).not.toContain("Omega-3 fatty acids");
    expect(nutrients).not.toContain("Vitamin D");
  });

  it("excludes foods via word-boundary matching on examples (egg blocks 'Egg yolk')", () => {
    const result = getFoodsToEat(["egg"], []);
    const nutrients = result.map((f) => f.nutrient);
    expect(nutrients).not.toContain("Vitamin D");
    expect(nutrients).not.toContain("Selenium");
    // "egg" must not block unrelated foods
    expect(nutrients).toContain("Vitamin C");
  });

  it("excludes foods matching a specific trigger by name", () => {
    const result = getFoodsToEat([], ["salmon"]);
    const nutrients = result.map((f) => f.nutrient);
    expect(nutrients).not.toContain("Omega-3 fatty acids");
    expect(nutrients).not.toContain("Vitamin D");
  });

  it("filters multiple allergens down to the safe remainder", () => {
    const result = getFoodsToEat(["nuts", "shellfish", "fish", "dairy", "egg", "gluten"], []);
    const nutrients = result.map((f) => f.nutrient).sort();
    expect(nutrients).toEqual(
      ["Antioxidant-rich foods", "Beta-carotene (vitamin A)", "Vitamin C", "Water-rich foods"].sort()
    );
  });

  it("does not treat 'chicken rice' as blocking 'brown rice'", () => {
    const result = getFoodsToEat([], ["chicken rice"]);
    const nutrients = result.map((f) => f.nutrient);
    expect(nutrients).toContain("Low-glycemic whole grains");
  });

  it("normalizes plural allergens ('eggs' blocks egg-containing foods)", () => {
    const result = getFoodsToEat(["eggs"], []);
    const nutrients = result.map((f) => f.nutrient);
    expect(nutrients).not.toContain("Vitamin D");
    expect(nutrients).not.toContain("Selenium");
  });

  it("normalizes synonyms ('milk' blocks dairy-containing foods)", () => {
    const result = getFoodsToEat(["milk"], []);
    const nutrients = result.map((f) => f.nutrient);
    expect(nutrients).not.toContain("Probiotic foods");
    expect(nutrients).not.toContain("Vitamin D");
  });
});
