"use server";

import { headers } from "next/headers";
import { ID, Permission, Role } from "node-appwrite";
import { createAdminServices, getCurrentAppwriteUser, isAppwriteAdminConfigured, STEPWISE_TABLES } from "@/lib/appwrite-server";
import { getCommercialPlan, isCommercialPlanId, type CommercialPlanId } from "@/lib/commercial";
import { isCommercialActivationReady } from "@/lib/merchant";
import { getSafepayApiBase, getSafepayCheckoutBase, getSafepayEnvironment } from "@/lib/safepay";
import { logAuditEvent } from "@/lib/audit";

export type CheckoutResult = {
  success: boolean;
  checkoutUrl?: string;
  orderId?: string;
  error?: string;
};

async function requestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (host) {
    const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${protocol}://${host}`;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://stepwise.page").replace(/\/$/, "");
}

export async function createSafepayCheckoutSession(planId: CommercialPlanId): Promise<CheckoutResult> {
  if (!isCommercialPlanId(planId)) return { success: false, error: "Choose a valid Stepwise access plan." };
  if (process.env.ENABLE_SAFEPAY_CHECKOUT !== "true") {
    return { success: false, error: "Secure checkout is not active yet." };
  }
  if (!isCommercialActivationReady().ready) {
    return { success: false, error: "Checkout is awaiting verified merchant and provider readiness." };
  }
  if (!isAppwriteAdminConfigured()) {
    return { success: false, error: "The billing service is not configured." };
  }
  const user = await getCurrentAppwriteUser();
  if (!user) return { success: false, error: "Sign in before purchasing access." };
  if (!user.emailVerification) return { success: false, error: "Verify your email before purchasing access." };

  const apiKey = process.env.SAFEPAY_API_KEY?.trim();
  if (!apiKey) return { success: false, error: "The payment provider is not configured." };

  const plan = getCommercialPlan(planId);
  const environment = getSafepayEnvironment(process.env.SAFEPAY_ENVIRONMENT);
  const { tables, config } = createAdminServices();
  const orderId = ID.unique();
  const now = new Date().toISOString();

  await tables.createRow({
    databaseId: config.databaseId,
    tableId: STEPWISE_TABLES.orders,
    rowId: orderId,
    permissions: [Permission.read(Role.user(user.$id))],
    data: {
      userId: user.$id,
      planId,
      amount: plan.amountCents,
      currency: plan.currency,
      status: "creating_tracker",
      provider: "safepay",
      createdAt: now,
      updatedAt: now,
    },
  });

  let response: Response;
  try {
    response = await fetch(`${getSafepayApiBase(environment)}/order/payments/v3/`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        amount: plan.amountCents,
        currency: plan.currency,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    await tables.updateRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.orders,
      rowId: orderId,
      data: { status: "tracker_failed", updatedAt: new Date().toISOString() },
    }).catch(() => undefined);
    await logAuditEvent({
      event: "checkout.tracker_request_failed",
      level: "error",
      actorUserId: user.$id,
      targetType: "order",
      targetId: orderId,
      details: { message: error instanceof Error ? error.message : "unknown" },
    });
    return { success: false, error: "Unable to initialize checkout. Try again shortly." };
  }

  if (!response.ok) {
    await tables.updateRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.orders,
      rowId: orderId,
      data: { status: "tracker_failed", updatedAt: new Date().toISOString() },
    });
    await logAuditEvent({
      event: "checkout.tracker_rejected",
      level: "error",
      actorUserId: user.$id,
      targetType: "order",
      targetId: orderId,
      details: { status: response.status },
    });
    return { success: false, error: "The payment provider could not start checkout." };
  }

  const data = await response.json() as {
    tracker?: { token?: string };
    data?: { token?: string; tracker?: { token?: string } };
  };
  const tracker = data.tracker?.token || data.data?.tracker?.token || data.data?.token;
  if (!tracker || typeof tracker !== "string") {
    await tables.updateRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.orders,
      rowId: orderId,
      data: { status: "invalid_tracker_response", updatedAt: new Date().toISOString() },
    });
    return { success: false, error: "The payment provider returned an invalid checkout session." };
  }

  await tables.updateRow({
    databaseId: config.databaseId,
    tableId: STEPWISE_TABLES.orders,
    rowId: orderId,
    data: {
      providerTracker: tracker,
      status: "checkout_ready",
      updatedAt: new Date().toISOString(),
    },
  });

  const origin = await requestOrigin();
  const checkoutUrl = new URL(getSafepayCheckoutBase(environment));
  checkoutUrl.searchParams.set("tracker", tracker);
  checkoutUrl.searchParams.set("source", "hosted");
  checkoutUrl.searchParams.set("redirect_url", new URL(`/checkout?payment=pending&order=${encodeURIComponent(orderId)}`, origin).toString());
  checkoutUrl.searchParams.set("cancel_url", new URL(`/checkout?payment=cancelled&order=${encodeURIComponent(orderId)}`, origin).toString());

  await logAuditEvent({
    event: "checkout.ready",
    actorUserId: user.$id,
    targetType: "order",
    targetId: orderId,
    details: { planId, environment },
  });
  return { success: true, checkoutUrl: checkoutUrl.toString(), orderId };
}
