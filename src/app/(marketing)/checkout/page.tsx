import type { Metadata } from "next";
import { CheckoutPage } from "@/components/Checkout";
import { isAppwriteAdminConfigured } from "@/lib/appwrite-server";
import { formatPlanPrice, getCommercialPlans, isCommercialPlanId } from "@/lib/commercial";
import { isCommercialActivationReady } from "@/lib/merchant";

export const metadata: Metadata = {
  title: "Choose access",
  description: "Choose a one-time Stepwise QBank access period.",
  robots: { index: false, follow: false },
};

export default async function CheckoutRoute({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; payment?: string; access?: string }>;
}) {
  const params = await searchParams;
  const plans = getCommercialPlans().map((plan) => ({
    id: plan.id,
    name: plan.name,
    accessDays: plan.accessDays,
    price: formatPlanPrice(plan.amountCents, plan.currency),
    description: plan.description,
  }));
  return (
    <CheckoutPage
      plans={plans}
      initialPlan={isCommercialPlanId(params.plan) ? params.plan : undefined}
      paymentState={params.payment}
      accessState={params.access}
      checkoutAvailable={process.env.ENABLE_SAFEPAY_CHECKOUT === "true"
        && process.env.ENABLE_SAFEPAY_WEBHOOK === "true"
        && Boolean(process.env.SAFEPAY_API_KEY)
        && isAppwriteAdminConfigured()
        && isCommercialActivationReady().ready}
    />
  );
}
