export const PLAN_CATALOG = {
  "stepwise-90": {
    id: "stepwise-90",
    name: "90 days",
    accessDays: 90,
    amountCents: 2_000,
    priceEnv: "STEPWISE_90_PRICE_CENTS",
    description: "A focused preparation window for a defined study sprint.",
  },
  "stepwise-180": {
    id: "stepwise-180",
    name: "180 days",
    accessDays: 180,
    amountCents: 3_000,
    priceEnv: "STEPWISE_180_PRICE_CENTS",
    description: "Six months of complete QBank, planning, and review access.",
  },
  "stepwise-360": {
    id: "stepwise-360",
    name: "360 days",
    accessDays: 360,
    amountCents: 5_000,
    priceEnv: "STEPWISE_360_PRICE_CENTS",
    description: "A full exam-cycle workspace with the lowest daily cost.",
  },
} as const;

export type CommercialPlanId = keyof typeof PLAN_CATALOG;

export function isCommercialPlanId(value: unknown): value is CommercialPlanId {
  return typeof value === "string" && value in PLAN_CATALOG;
}

export function getCommercialPlans() {
  const currency = process.env.PAYMENT_CURRENCY?.trim().toUpperCase() || "USD";
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("PAYMENT_CURRENCY must be a three-letter currency code.");

  return Object.values(PLAN_CATALOG).map((plan) => {
    const configured = Number(process.env[plan.priceEnv] ?? plan.amountCents);
    if (!Number.isInteger(configured) || configured <= 0) {
      throw new Error(`${plan.priceEnv} must be a positive integer in minor currency units.`);
    }
    return { ...plan, amountCents: configured, currency };
  });
}

export function getCommercialPlan(planId: CommercialPlanId) {
  const plan = getCommercialPlans().find((candidate) => candidate.id === planId);
  if (!plan) throw new Error("Plan configuration is unavailable.");
  return plan;
}

export function extendSubscriptionExpiry(currentExpiry: string | null | undefined, accessDays: number, now = new Date()) {
  const current = currentExpiry ? new Date(currentExpiry) : null;
  const start = current && Number.isFinite(current.getTime()) && current > now ? current : now;
  return new Date(start.getTime() + accessDays * 86_400_000).toISOString();
}

export function hasActiveSubscription(
  subscription: { status?: unknown; expiresAt?: unknown } | null | undefined,
  now = Date.now(),
) {
  if (subscription?.status !== "active") return false;
  const expiry = typeof subscription.expiresAt === "string" ? Date.parse(subscription.expiresAt) : Number.NaN;
  return Number.isFinite(expiry) && expiry > now;
}

export function formatPlanPrice(amountCents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}
