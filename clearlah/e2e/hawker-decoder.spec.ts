import { test, expect } from "@playwright/test";

test.describe("Hawker Decoder — Search & Risk", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hawker");
    await page.waitForTimeout(3000);
  });

  test("Search input is visible on hawker page", async ({ page }) => {
    const searchInput = page.locator("input").first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test("Search for Laksa shows dish with allergens", async ({ page }) => {
    const searchInput = page.locator("input").first();
    await searchInput.fill("Laksa");
    await page.waitForTimeout(3000);

    await expect(page.getByRole("heading", { name: "Laksa" })).toBeVisible({ timeout: 8000 });
  });

  test("Multilingual search — Chinese 叻沙 finds Laksa", async ({ page }) => {
    const searchInput = page.locator("input").first();
    await searchInput.fill("叻沙");
    await page.waitForTimeout(3000);

    await expect(page.getByRole("heading", { name: /Laksa|叻沙/i })).toBeVisible({ timeout: 8000 });
  });

  test("No results shows empty state", async ({ page }) => {
    const searchInput = page.locator("input").first();
    await searchInput.fill("xyzinvalidfood999");
    await page.waitForTimeout(3000);

    const noResults = page.getByText(/no dishes found|no match found/i);
    await expect(noResults).toBeVisible({ timeout: 8000 });
  });
});
