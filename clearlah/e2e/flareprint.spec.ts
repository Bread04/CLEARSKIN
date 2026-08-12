import { test, expect } from "@playwright/test";

test.describe("FlarePrint — Location Trigger Map", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/flareprint");
    await page.waitForTimeout(3000);
  });

  test("FlarePrint page loads with header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "FlarePrint" })).toBeVisible({ timeout: 10000 });
  });

  test("shows empty state when no location data logged", async ({ page }) => {
    const emptyText = page.getByText(/No flares mapped yet/i);
    await expect(emptyText.first()).toBeVisible({ timeout: 8000 });
  });

  test("date range filter buttons are visible", async ({ page }) => {
    const sevenDayBtn = page.getByRole("button", { name: "7d" });
    const thirtyDayBtn = page.getByRole("button", { name: "30d" });
    await expect(sevenDayBtn).toBeVisible({ timeout: 8000 });
    await expect(thirtyDayBtn).toBeVisible({ timeout: 8000 });
  });

  test("privacy section is visible", async ({ page }) => {
    const privacyLink = page.getByText(/Manage privacy settings/i);
    await expect(privacyLink).toBeVisible({ timeout: 8000 });
  });

  test("bottom navigation includes Map tab", async ({ page }) => {
    const mapTab = page.locator("nav").getByText("Map");
    await expect(mapTab).toBeVisible({ timeout: 10000 });
  });

  test("Map tab navigates to flareprint page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    const mapTab = page.locator("nav").getByText("Map");
    await mapTab.click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/flareprint/);
  });

  test("FlarePrint settings page loads", async ({ page }) => {
    await page.goto("/flareprint/settings");
    await page.waitForTimeout(3000);
    await expect(page.getByText("Location Logging")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Community Sharing")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Delete My Location Data")).toBeVisible({ timeout: 8000 });
  });
});
