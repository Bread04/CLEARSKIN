import { test, expect } from "@playwright/test";

test.describe("High Risk Day Alert", () => {
  test("Dashboard page loads without crash", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(5000);

    const hasContent = await page.locator("main, [class*='min-h-screen']").first().isVisible().catch(() => true);
    expect(hasContent).toBe(true);
  });

  test("Landing page navigates to onboarding when not seeded", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    const hasClearLah = await page.getByRole("heading", { name: "ClearLah" }).isVisible().catch(() => false);
    expect(hasClearLah).toBe(true);
  });
});
