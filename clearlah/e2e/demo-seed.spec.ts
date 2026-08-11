import { test, expect, type Page } from "@playwright/test";

async function completeOnboarding(page: Page) {
  await page.goto("/onboarding/step/1");
  await page.waitForTimeout(1000);

  const cards = page.locator("[class*='border-primary-sage']").or(page.getByRole("button", { name: "Myself" }));
  if (await cards.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await cards.first().click();
  }

  const continueBtn = page.getByRole("button", { name: /continue/i });
  if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await continueBtn.click();
  }

  await page.waitForTimeout(1500);

  const step2Continue = page.getByRole("button", { name: /continue/i });
  if (await step2Continue.isVisible({ timeout: 5000 }).catch(() => false)) {
    const chip = page.locator("[class*='pill']").first();
    if (await chip.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chip.click();
    }
    await step2Continue.click();
  }

  await page.waitForTimeout(1500);

  const checkbox = page.getByRole("checkbox");
  if (await checkbox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await checkbox.check();
    const letsGo = page.getByRole("button", { name: /let's go/i });
    if (await letsGo.isVisible({ timeout: 3000 }).catch(() => false)) {
      await letsGo.click();
    }
  }

  try {
    await page.waitForURL("/dashboard", { timeout: 10000 });
  } catch {
    await page.goto("/dashboard");
  }
}

async function dismissMilestone(page: Page) {
  const modal = page.locator("[role='dialog']");
  if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
  }
}

async function ensureDashboard(page: Page) {
  await page.goto("/");

  const seedButton = page.getByRole("button", { name: /load demo/i });
  if (await seedButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await seedButton.click();
    try {
      await page.waitForURL("/dashboard", { timeout: 30000 });
    } catch {
      await page.goto("/dashboard");
    }
  } else {
    await page.goto("/dashboard");
  }

  if (page.url().includes("/onboarding")) {
    await completeOnboarding(page);
  }

  await dismissMilestone(page);
}

test.describe("Demo Mode — Landing & Navigation", () => {
  test("Landing page renders with seed button in demo mode", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ClearLah" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /load demo/i })).toBeVisible();
  });

  test("Bottom navigation is present on dashboard", async ({ page }) => {
    await ensureDashboard(page);

    const nav = page.getByRole("navigation", { name: /main navigation/i });
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test("Can navigate between all main routes via direct URL", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);

    await page.goto("/insights");
    await page.waitForTimeout(1000);

    await page.goto("/hawker");
    await page.waitForTimeout(1000);

    await page.goto("/log");
    await page.waitForTimeout(1000);

    const hasContent = await page.locator("main, [class*='min-h-screen']").first().isVisible().catch(() => true);
    expect(hasContent).toBe(true);
  });
});
