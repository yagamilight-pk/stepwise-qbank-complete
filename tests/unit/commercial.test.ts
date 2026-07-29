import { afterEach, describe, expect, it } from "vitest";
import {
  extendSubscriptionExpiry,
  formatPlanPrice,
  getCommercialPlan,
  getCommercialPlans,
  hasActiveSubscription,
  isCommercialPlanId,
} from "@/lib/commercial";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
});

describe("commercial plan catalog", () => {
  it("exposes only the three server-owned one-time plans", () => {
    expect(getCommercialPlans().map(plan => [plan.id, plan.accessDays, plan.amountCents])).toEqual([
      ["stepwise-90", 90, 2_000],
      ["stepwise-180", 180, 3_000],
      ["stepwise-360", 360, 5_000],
    ]);
    expect(isCommercialPlanId("stepwise-180")).toBe(true);
    expect(isCommercialPlanId("stepwise-free")).toBe(false);
  });

  it("accepts validated server-side price overrides and rejects invalid ones", () => {
    process.env.STEPWISE_90_PRICE_CENTS = "2500";
    expect(getCommercialPlan("stepwise-90").amountCents).toBe(2_500);
    process.env.STEPWISE_90_PRICE_CENTS = "-1";
    expect(() => getCommercialPlans()).toThrow(/positive integer/);
    process.env.STEPWISE_90_PRICE_CENTS = "2000";
    process.env.PAYMENT_CURRENCY = "US";
    expect(() => getCommercialPlans()).toThrow(/three-letter/);
  });

  it("extends future access rather than discarding remaining days", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    expect(extendSubscriptionExpiry(null, 90, now)).toBe("2026-04-01T00:00:00.000Z");
    expect(extendSubscriptionExpiry("2026-02-01T00:00:00.000Z", 90, now)).toBe("2026-05-02T00:00:00.000Z");
    expect(extendSubscriptionExpiry("invalid", 90, now)).toBe("2026-04-01T00:00:00.000Z");
  });

  it("requires active status and a future expiry", () => {
    const now = Date.parse("2026-01-01T00:00:00.000Z");
    expect(hasActiveSubscription({ status: "active", expiresAt: "2026-01-02T00:00:00.000Z" }, now)).toBe(true);
    expect(hasActiveSubscription({ status: "revoked", expiresAt: "2026-01-02T00:00:00.000Z" }, now)).toBe(false);
    expect(hasActiveSubscription({ status: "active", expiresAt: "2025-12-31T00:00:00.000Z" }, now)).toBe(false);
    expect(hasActiveSubscription(null, now)).toBe(false);
    expect(formatPlanPrice(2_000)).toBe("$20");
  });
});
