import { test, expect } from "@playwright/test";

test.describe("ClearCart — Safe Food Shop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/clearcart");
    await page.waitForTimeout(3000);
  });

  test("ClearCart page loads with header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "My Safe Shop" })).toBeVisible({ timeout: 10000 });
  });

  test("shows empty state when fewer than 7 logs", async ({ page }) => {
    const emptyText = page.getByText(/Log 7\+ days/i);
    await expect(emptyText.first()).toBeVisible({ timeout: 8000 });
  });

  test("bottom navigation includes Shop tab", async ({ page }) => {
    const shopTab = page.locator("nav").getByText("Shop");
    await expect(shopTab).toBeVisible({ timeout: 10000 });
  });

  test("Shop tab navigates to clearcart page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    const shopTab = page.locator("nav").getByText("Shop");
    await shopTab.click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/clearcart/);
  });
});
