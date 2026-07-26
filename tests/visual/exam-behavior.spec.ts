import { expect, test } from "@playwright/test";

test.describe("current USMLE exam-mode behavior", () => {
  test("restores a timed block with answer, confidence, elimination, position, and elapsed state", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");

    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.sessionStorage.setItem("stepwise-session-config", JSON.stringify({
        step: "Step 2 CK",
        mode: "Timed",
        count: 3,
        systems: [],
        disciplines: [],
        difficulties: [],
        include: "All",
        timePerQuestionSec: 90
      }));
    });
    await page.goto("/app/session", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".session-page")).toBeVisible({ timeout: 15_000 });

    await page.locator(".session-choice .choice-select").first().click();
    await page.locator(".confidence-select button").filter({ hasText: "High" }).click();
    await page.locator(".session-choice .strike-button").nth(1).click();
    await page.getByRole("button", { name: "Save & next" }).click();
    await expect(page.locator(".session-progress-title")).toContainText("Question 2 of 3");
    await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("stepwise-active-session-v1"))).not.toBeNull();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".session-page")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Block restored")).toBeVisible();
    await expect(page.locator(".session-progress-title")).toContainText("Question 2 of 3");

    await page.getByRole("button", { name: "Question navigator" }).click();
    await page.locator(".question-palette > div > button").first().click();
    await expect(page.locator(".session-choice .choice-select").first()).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".session-choice .strike-button").nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".confidence-select button").filter({ hasText: "High" })).toHaveAttribute("aria-pressed", "true");

    expect(runtimeErrors).toEqual([]);
  });

  test("reconciles answer edits and scores unanswered items against the full block", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");

    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.sessionStorage.setItem("stepwise-session-config", JSON.stringify({
        step: "Step 2 CK",
        mode: "Timed",
        count: 2,
        systems: [],
        disciplines: [],
        difficulties: [],
        include: "All",
        timePerQuestionSec: 90
      }));
    });
    await page.goto("/app/session", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".session-page")).toBeVisible({ timeout: 15_000 });

    const choices = page.locator(".session-choice .choice-select");
    await choices.first().click();
    await expect.poll(async () => page.evaluate(() => {
      const draft = JSON.parse(window.sessionStorage.getItem("stepwise-active-session-v1") || "{}");
      return Object.values(draft.selected || {})[0] ?? null;
    })).not.toBeNull();
    const firstDraftChoice = await page.evaluate(() => {
      const draft = JSON.parse(window.sessionStorage.getItem("stepwise-active-session-v1") || "{}");
      return Object.values(draft.selected || {})[0];
    });
    await choices.nth(1).click();
    await expect.poll(async () => page.evaluate(() => {
      const draft = JSON.parse(window.sessionStorage.getItem("stepwise-active-session-v1") || "{}");
      return Object.values(draft.selected || {})[0];
    })).not.toBe(firstDraftChoice);

    await page.getByRole("button", { name: "Question navigator" }).click();
    await page.getByRole("button", { name: "Finish block" }).click();
    const finishDialog = page.getByRole("dialog", { name: "Finish this block now?" });
    await expect(finishDialog).toContainText("1 unanswered item");
    await finishDialog.getByRole("button", { name: "Finish & score" }).click();

    await expect(page.locator(".session-summary")).toBeVisible();
    await expect(page.locator(".summary-score-main")).toContainText("1 answered · 1 unanswered");
    await expect(page.locator(".summary-score-main")).toContainText("of 2 total items");
    await expect(page.locator(".summary-review")).toContainText("Unanswered");
    expect(await page.evaluate(() => window.sessionStorage.getItem("stepwise-active-session-v1"))).toBeNull();
  });

  test("uses the 2026 Step 2 CK block profile and keeps answers reviewable", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");

    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
    });

    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    const response = await page.goto("/app/qbank", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(page.locator(".route-loading")).toHaveCount(0, { timeout: 15_000 });
    await page.locator(".mode-grid > button").filter({ hasText: /^Exam/ }).click();

    await expect(page.locator(".exam-standard")).toHaveClass(/active/);
    await expect(page.locator(".exam-standard")).toContainText("2026 testing software");
    await expect(page.locator(".exam-standard")).toContainText("16 × 30-minute blocks");
    await expect(page.locator('input[aria-label="Question count"]')).toHaveAttribute("max", "20");
    await expect(page.locator('input[aria-label="Question count"]')).toHaveValue("20");

    await page.locator(".builder-summary").getByRole("button", { name: "Start block" }).click();
    await expect(page.locator(".session-page")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".exam-continuous")).toContainText("Continuous");
    await expect(page.getByRole("button", { name: /Pause/ })).toHaveCount(0);
    await expect(page.locator(".session-timer b")).toHaveText(/30:00|29:59/);

    const choices = page.locator(".session-choice .choice-select");
    await choices.nth(0).click();
    await expect(page.locator(".session-choice.correct, .session-choice.wrong")).toHaveCount(0);
    await expect(page.locator(".distribution-note")).toHaveCount(0);
    await page.getByRole("button", { name: "Save & next" }).click();

    await expect(page.locator(".session-progress-title")).toContainText("Question 2 of");
    await page.getByRole("button", { name: "Question navigator" }).click();
    const firstPaletteQuestion = page.locator(".question-palette > div > button").first();
    await expect(firstPaletteQuestion).toHaveClass(/answered/);
    await expect(firstPaletteQuestion).not.toHaveClass(/correct|incorrect/);
    await firstPaletteQuestion.click();

    await expect(page.locator(".session-progress-title")).toContainText("Question 1 of");
    await expect(choices.nth(0)).toBeEnabled();
    await choices.nth(1).click();
    await expect(page.locator(".session-choice.correct, .session-choice.wrong")).toHaveCount(0);
    await expect(page.locator(".distribution-note")).toHaveCount(0);

    await page.getByRole("button", { name: "Session settings", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Session display settings" })).toBeVisible();
    const timerToggle = page.getByRole("checkbox", { name: "Show block timer" });
    await expect(timerToggle).toBeChecked();
    await page.locator(".toggle-row").filter({ hasText: "Show block timer" }).click();
    await expect(timerToggle).not.toBeChecked();
    await expect(page.locator(".session-timer")).toHaveCount(0);
    await page.getByRole("button", { name: "Apply settings" }).click();

    expect(runtimeErrors).toEqual([]);
  });

  test("keeps essential session tools available on phone and tablet", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-1440");

    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    const response = await page.goto("/app/session", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(page.locator(".session-page")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Question navigator" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Session settings", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause session" })).toBeVisible();
    await expect(page.locator(".session-timer")).toBeVisible();

    await page.getByRole("button", { name: "Open session tools" }).click();
    const toolsDialog = page.getByRole("dialog", { name: "Session tools" });
    await expect(toolsDialog).toBeVisible();
    await toolsDialog.getByRole("button", { name: /Laboratory values/ }).click();
    await expect(page.getByRole("dialog", { name: "Common laboratory reference values" })).toBeVisible();
  });
});
