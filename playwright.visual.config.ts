import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 4,
  timeout: 60_000,
  outputDir: "artifacts/test-results",
  reporter: [
    ["list"],
    ["html", { outputFolder: "artifacts/playwright-report", open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3108",
    channel: "chrome",
    colorScheme: "light",
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "Asia/Karachi",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-1440",
      use: { viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "tablet-768",
      use: { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true },
    },
    {
      name: "mobile-390",
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
});
