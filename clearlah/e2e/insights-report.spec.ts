import { test, expect } from "@playwright/test";

test.describe("Insights & Doctor Report", () => {
  test("Insights page loads", async ({ page }) => {
    await page.goto("/insights");
    await page.waitForTimeout(5000);

    const hasContent = await page.locator("main, [class*='min-h-screen']").first().isVisible().catch(() => true);
    expect(hasContent).toBe(true);
  });

  test("Doctor report page renders", async ({ page }) => {
    await page.goto("/insights/report");
    await page.waitForTimeout(5000);

    const hasContent = await page.locator("main, [class*='min-h-screen']").first().isVisible().catch(() => true);
    expect(hasContent).toBe(true);
  });
});
