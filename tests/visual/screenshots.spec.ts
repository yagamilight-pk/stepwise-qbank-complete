import { expect, test } from "@playwright/test";
import { join } from "node:path";

const allDesktopRoutes = [
  ["/", "home"],
  ["/try", "guided-trial"],
  ["/login", "login"],
  ["/signup", "signup"],
  ["/onboarding", "onboarding"],
  ["/forgot-password", "forgot-password"],
  ["/help", "help"],
  ["/privacy", "privacy"],
  ["/terms", "terms"],
  ["/cookies", "cookies"],
  ["/accessibility", "accessibility"],
  ["/app", "learner-overview"],
  ["/app/qbank", "learner-qbank"],
  ["/app/exam-day", "learner-exam-day"],
  ["/app/session", "learner-session"],
  ["/app/analytics", "learner-analytics"],
  ["/app/study-plan", "learner-study-plan"],
  ["/app/flashcards", "learner-flashcards"],
  ["/app/library", "learner-library"],
  ["/app/notebook", "learner-notebook"],
  ["/app/community", "learner-community"],
  ["/app/settings", "learner-settings"],
  ["/admin", "admin-overview"],
  ["/admin/importer", "admin-importer"],
  ["/admin/questions", "admin-questions"],
  ["/admin/users", "admin-users"],
  ["/admin/content", "admin-content"],
  ["/admin/affiliates", "admin-affiliates"],
  ["/admin/reports", "admin-reports"],
  ["/admin/billing", "admin-billing"],
  ["/admin/settings", "admin-settings"],
  ["/influencer", "partner-overview"],
  ["/influencer/links", "partner-links"],
  ["/influencer/conversions", "partner-conversions"],
  ["/influencer/payouts", "partner-payouts"],
  ["/influencer/media", "partner-media"],
] as const;

const responsiveRoutes = new Set([
  "/",
  "/try",
  "/login",
  "/app",
  "/app/qbank",
  "/app/exam-day",
  "/app/session",
  "/app/analytics",
  "/app/study-plan",
  "/app/flashcards",
  "/app/library",
  "/admin",
  "/admin/questions",
  "/influencer",
  "/help",
]);

test.describe.configure({ mode: "parallel" });

for (const [route, name] of allDesktopRoutes) {
  test(`${name} visual capture`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440" && !responsiveRoutes.has(route));

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

    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${route} should render successfully`).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    if (route.startsWith("/app") || route.startsWith("/admin") || route.startsWith("/influencer")) {
      await expect(page.locator(".route-loading")).toHaveCount(0, { timeout: 15_000 });
    }
    if (route === "/app/session") {
      await expect(page.locator(".session-page")).toBeVisible();
    }
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(250);

    const outputPath = join(
      process.cwd(),
      "artifacts",
      "visual-review",
      testInfo.project.name,
      `${name}.png`,
    );

    await page.screenshot({
      path: outputPath,
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    expect(runtimeErrors, `${route} emitted browser runtime errors`).toEqual([]);
  });
}

test("learner-overview-dark visual capture", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "tablet-768");

  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });

  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  const response = await page.goto("/app", { waitUntil: "domcontentloaded" });
  expect(response?.status(), "/app should render successfully in dark-theme capture").toBe(200);
  await expect(page.locator(".route-loading")).toHaveCount(0, { timeout: 15_000 });
  await expect.poll(
    () => page.evaluate(() => window.localStorage.getItem("stepwise-qbank-state-v8")),
    { timeout: 15_000, message: "Stepwise state should persist before the dark-theme capture." },
  ).not.toBeNull();
  await page.evaluate(() => {
    const key = "stepwise-qbank-state-v8";
    const stored = window.localStorage.getItem(key);
    if (!stored) throw new Error("Stepwise state was not persisted before dark-theme capture.");
    const state = JSON.parse(stored);
    state.settings = { ...state.settings, theme: "dark" };
    window.localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".route-loading")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);

  const outputPath = join(
    process.cwd(),
    "artifacts",
    "visual-review",
    testInfo.project.name,
    "learner-overview-dark.png",
  );
  await page.screenshot({
    path: outputPath,
    fullPage: true,
    animations: "disabled",
    caret: "hide",
  });

  expect(runtimeErrors, "/app dark theme emitted browser runtime errors").toEqual([]);
});
