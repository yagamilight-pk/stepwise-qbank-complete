"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarClock, Check, CircleAlert, CreditCard, ShieldCheck } from "lucide-react";
import { Badge } from "./ui";

type SubscriptionResponse = {
  configured?: boolean;
  active?: boolean;
  subscription?: {
    planId?: string;
    status?: string;
    startsAt?: string;
    expiresAt?: string;
  } | null;
  error?: string;
};

const plans = [
  { id: "stepwise-90", days: 90, price: "$20" },
  { id: "stepwise-180", days: 180, price: "$30" },
  { id: "stepwise-360", days: 360, price: "$50" },
] as const;

export function SubscriptionSettings() {
  const authConfigured = process.env.NEXT_PUBLIC_AUTH_PROVIDER === "appwrite";
  const [result, setResult] = useState<SubscriptionResponse | null>(() => (
    authConfigured ? null : { configured: false, active: false, subscription: null }
  ));

  useEffect(() => {
    if (!authConfigured) return;
    let active = true;
    fetch("/api/subscription", { cache: "no-store" })
      .then(response => response.json())
      .then(payload => {
        if (active) setResult(payload as SubscriptionResponse);
      })
      .catch(() => {
        if (active) setResult({ error: "Unable to load subscription status." });
      });
    return () => {
      active = false;
    };
  }, [authConfigured]);

  if (!result) {
    return <div className="subscription-status-loading" role="status">Loading verified subscription status…</div>;
  }

  return <div className="subscription-settings">
    {result.active && result.subscription ? <article className="subscription-card active">
      <div>
        <Badge tone="success">ACTIVE</Badge>
        <h2>Stepwise access</h2>
        <p>Your access was confirmed from the server-side subscription ledger.</p>
      </div>
      <div><CalendarClock/><span><b>{result.subscription.expiresAt ? new Date(result.subscription.expiresAt).toLocaleDateString("en-US", { dateStyle: "long" }) : "Active"}</b><small>Access expiration</small></span></div>
      <footer><span>Purchasing another one-time plan extends this date.</span><Link className="btn btn-secondary" href="/checkout">Extend access</Link></footer>
    </article> : <article className="subscription-empty panel">
      <span><CreditCard/></span>
      <div>
        <Badge tone={result.configured ? "neutral" : "warning"}>{result.configured ? "NO ACTIVE PLAN" : "CHECKOUT NOT CONFIGURED"}</Badge>
        <h2>Choose one-time access.</h2>
        <p>{result.configured ? "Access activates only after Stepwise verifies Safepay’s signed webhook." : "The pricing catalog is ready, but production payment credentials and the Appwrite ledger must be configured before checkout can open."}</p>
      </div>
    </article>}
    <div className="settings-plan-grid">
      {plans.map(plan => <Link key={plan.id} href={`/checkout?plan=${plan.id}`}>
        <span><CalendarClock/></span>
        <b>{plan.days} days</b>
        <strong>{plan.price}</strong>
        <small><Check/> One payment · no auto-renewal</small>
      </Link>)}
    </div>
    {result.error && <p className="form-error"><CircleAlert/> {result.error}</p>}
    <p className="subscription-integrity"><ShieldCheck/> Prices are selected from the server-owned catalog; the browser cannot set an amount or activate access.</p>
  </div>;
}
