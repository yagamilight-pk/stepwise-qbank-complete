"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { BadgeCheck, CalendarClock, Check, CircleAlert, CreditCard, ShieldCheck } from "lucide-react";
import { createSafepayCheckoutSession } from "@/app/actions/checkout";
import type { CommercialPlanId } from "@/lib/commercial";
import { Logo } from "./ui";

type PlanView = {
  id: CommercialPlanId;
  name: string;
  accessDays: number;
  price: string;
  description: string;
};

export function CheckoutPage({
  plans,
  initialPlan,
  paymentState,
  accessState,
  checkoutAvailable,
}: {
  plans: PlanView[];
  initialPlan?: CommercialPlanId;
  paymentState?: string;
  accessState?: string;
  checkoutAvailable: boolean;
}) {
  const [selected, setSelected] = useState<CommercialPlanId>(initialPlan ?? "stepwise-180");
  const [error, setError] = useState("");
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (paymentState !== "pending") return;
    let active = true;
    const check = async () => {
      const response = await fetch("/api/subscription", { cache: "no-store" });
      const payload = await response.json().catch(() => null) as { active?: boolean } | null;
      if (active && payload?.active) setSubscriptionActive(true);
    };
    check();
    const timer = window.setInterval(check, 3_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [paymentState]);

  const checkout = () => {
    setError("");
    startTransition(async () => {
      const result = await createSafepayCheckoutSession(selected);
      if (!result.success || !result.checkoutUrl) {
        setError(result.error ?? "Unable to open secure checkout.");
        return;
      }
      window.location.assign(result.checkoutUrl);
    });
  };

  return (
    <main className="checkout-page">
      <header className="static-nav"><Logo /><Link className="btn btn-secondary" href="/">Back to plans</Link></header>
      <section className="checkout-shell" aria-labelledby="checkout-title">
        <header>
          <div className="eyebrow"><ShieldCheck /> One-time access</div>
          <h1 id="checkout-title">Choose your preparation window.</h1>
          <p>One payment. No automatic renewal. New purchases extend any active access you already have.</p>
        </header>
        {paymentState === "cancelled" && <p className="checkout-notice warning"><CircleAlert /> Checkout was cancelled. No access change was made.</p>}
        {paymentState === "pending" && <p className={`checkout-notice ${subscriptionActive ? "success" : ""}`}>{subscriptionActive ? <BadgeCheck /> : <CalendarClock />}{subscriptionActive ? "Payment confirmed. Your Stepwise access is active." : "Payment returned to Stepwise. Waiting for Safepay’s signed confirmation…"}</p>}
        {accessState === "required" && <p className="checkout-notice warning"><CircleAlert/> An active plan is required for the learner workspace.</p>}
        {accessState === "unavailable" && <p className="checkout-notice warning"><CircleAlert/> Access verification is temporarily unavailable. Do not attempt payment until the service is restored.</p>}
        {!checkoutAvailable && <p className="checkout-notice warning"><CircleAlert/> Secure checkout is not active in this environment. Plan details are shown for review only.</p>}
        <div className="checkout-plan-grid">
          {plans.map((plan) => (
            <button
              type="button"
              key={plan.id}
              className={selected === plan.id ? "selected" : ""}
              aria-pressed={selected === plan.id}
              onClick={() => setSelected(plan.id)}
            >
              <span><CalendarClock /></span>
              <strong>{plan.name}</strong>
              <b>{plan.price}</b>
              <p>{plan.description}</p>
              <small><Check /> Complete learner workspace</small>
            </button>
          ))}
        </div>
        <aside className="checkout-summary">
          <div><CreditCard /><span><b>Safepay hosted checkout</b><small>Stepwise never receives your card number.</small></span></div>
          <button type="button" className="btn btn-brand btn-lg" onClick={checkout} disabled={!checkoutAvailable || pending || subscriptionActive}>
            {subscriptionActive ? "Access active" : !checkoutAvailable ? "Checkout not active" : pending ? "Opening secure checkout…" : "Continue to secure payment"}
          </button>
        </aside>
        {error && <p className="form-error" role="alert">{error} {error.includes("Sign in") && <Link href={`/login?returnTo=${encodeURIComponent(`/checkout?plan=${selected}`)}`}>Sign in</Link>}</p>}
        <p className="checkout-terms">
          By continuing, you agree to the <Link href="/terms">Terms</Link>,{" "}
          <Link href="/payments">Payment Terms</Link>, and <Link href="/refunds">Refund Policy</Link>.
          Review <Link href="/delivery">digital delivery</Link> and <Link href="/privacy">privacy</Link>.
          Access begins only after a valid signed payment webhook is processed.
        </p>
      </section>
    </main>
  );
}
