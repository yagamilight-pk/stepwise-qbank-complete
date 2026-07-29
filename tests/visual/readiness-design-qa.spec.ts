import { expect, test } from "@playwright/test";
import path from "node:path";

test("readiness without guesswork design evidence", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "Desktop evidence is the comparison source.");

  await page.goto("/");
  const card = page.locator(".feature-readiness");

  await expect(card).toBeVisible();
  await expect(card.getByRole("heading", { name: "Readiness without guesswork." })).toBeVisible();
  await expect(card.getByRole("link", { name: "Review due concepts" })).toHaveAttribute("href", "/app/flashcards");

  await card.screenshot({
    path: path.join(process.cwd(), "artifacts", "visual-review", "readiness-card-implementation.png"),
  });
});
