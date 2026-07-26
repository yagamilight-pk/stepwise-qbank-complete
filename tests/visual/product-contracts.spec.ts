import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  await expect.poll(() => page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }))).toEqual(expect.objectContaining({
    viewport: expect.any(Number),
    content: expect.any(Number)
  }));
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(dimensions.content, `page width ${dimensions.content}px should fit viewport ${dimensions.viewport}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test.describe("enterprise product contracts", () => {
  test("learner, session, and admin surfaces expose one main landmark without horizontal overflow", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    for (const route of ["/app", "/app/exam-day", "/app/session", "/admin/questions"]) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.locator(".route-loading")).toHaveCount(0, { timeout: 15_000 });
      await expect(page.locator("main")).toHaveCount(1);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("question editor exposes governance and truthful delivery boundaries", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto("/admin/questions", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".route-loading")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator(".workspace-trustline")).toContainText("Local state saved", { timeout: 15_000 });
    const editButton = page.getByRole("button", { name: /^Edit / }).first();
    await expect(editButton).toBeEnabled();
    await editButton.click();
    await expect(page.locator(".governance-readiness")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("Delivery boundary")).toHaveValue("Demo");
    await expect(page.locator(".governance-readiness")).toContainText("isolated from production learner delivery");
    await expect(page.getByRole("button", { name: "Publish demo" })).toBeVisible();

    await page.getByLabel("Item format").selectOption("Chart / tabular");
    await expect(page.getByText("Patient chart structure")).toBeVisible();
    await page.getByRole("button", { name: "Add section" }).click();
    await expect(page.locator(".chart-row-editor")).toHaveCount(1);
    await expect(page.locator(".editor-format-preview.chart")).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish demo" })).toBeDisabled();
  });

  test("signup intent reaches onboarding and initializes the learner workspace", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem("stepwise-qbank-state-v8")), { timeout: 15_000 }).not.toBeNull();
    await page.getByLabel("Full name").fill("Jordan Lee");
    await page.getByLabel("Email address").fill("jordan@example.com");
    await page.getByRole("textbox", { name: "Password" }).fill("secure-demo-password");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: /USMLE Step 1/ }).click();
    await page.getByLabel("Target exam date").fill("2026-12-18");
    await page.getByRole("button", { name: /Create demo workspace/ }).click();

    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByRole("button", { name: /USMLE Step 1/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel(/Target exam date/)).toHaveValue("2026-12-18");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Open my workspace" }).click();

    await expect(page).toHaveURL(/\/app$/);
    await expect(page.locator(".workspace-trustline")).toContainText("Step 1 study workspace");
    await expect(page.locator(".profile-button")).toContainText("Jordan Lee");
    await expect(page.getByText("Learner workspace · Step 1", { exact: true })).toBeVisible();

    await page.goto("/app/qbank", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".route-loading")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator(".large-choice-grid > button[aria-pressed='true']")).toContainText("USMLE Step 1");
  });

  test("production responses include baseline security headers", async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");
    const response = await request.get("/");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(response.headers()["permissions-policy"]).toContain("camera=()");
  });
});
