import crypto from "node:crypto";
import { AppwriteException, Permission, Query, Role } from "node-appwrite";
import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { createAdminServices, isAppwriteAdminConfigured, STEPWISE_TABLES } from "@/lib/appwrite-server";
import { extendSubscriptionExpiry, getCommercialPlan, isCommercialPlanId } from "@/lib/commercial";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { parseSafepayWebhook, verifySafepaySignature } from "@/lib/safepay";

const MAX_WEBHOOK_BYTES = 256 * 1024;

function eventRowId(providerEventId: string) {
  return crypto.createHash("sha256").update(`safepay:${providerEventId}`).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  if (process.env.ENABLE_SAFEPAY_WEBHOOK !== "true") {
    return NextResponse.json({ error: "Payment webhook is disabled" }, { status: 503 });
  }
  if (!isAppwriteAdminConfigured()) {
    return NextResponse.json({ error: "Payment database is unavailable" }, { status: 503 });
  }
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  const secret = process.env.SAFEPAY_WEBHOOK_SECRET?.trim() || "";
  const signature = request.headers.get("x-sfpy-signature") || "";
  if (!secret) return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  if (!verifySafepaySignature(rawBody, signature, secret)) {
    await logAuditEvent({ event: "webhook.safepay.invalid_signature", level: "warn" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const event = parseSafepayWebhook(payload, rawBody, request.headers.get("x-sfpy-event-id") || "");
  if (!event.tracker || !event.providerEventId) {
    return NextResponse.json({ error: "Missing tracker or event identifier" }, { status: 400 });
  }

  const { tables, users, config } = createAdminServices();
  const orders = await tables.listRows({
    databaseId: config.databaseId,
    tableId: STEPWISE_TABLES.orders,
    queries: [Query.equal("providerTracker", event.tracker), Query.limit(1)],
  });
  const order = orders.rows[0];
  if (!order) {
    await logAuditEvent({
      event: "webhook.safepay.order_not_found",
      level: "error",
      details: { trackerHash: crypto.createHash("sha256").update(event.tracker).digest("hex").slice(0, 16) },
    });
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const paymentEventId = eventRowId(event.providerEventId);
  try {
    await tables.createRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.paymentEvents,
      rowId: paymentEventId,
      data: {
        provider: "safepay",
        providerEventId: event.providerEventId,
        eventType: event.state,
        signatureVerified: true,
        status: "processing",
        userId: String(order.userId),
        orderId: order.$id,
        providerTracker: event.tracker,
        payloadHash: event.payloadHash,
        receivedAt: new Date().toISOString(),
        attempts: 1,
      },
    });
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 409) throw error;
    const existing = await tables.getRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.paymentEvents,
      rowId: paymentEventId,
    });
    return NextResponse.json({ duplicate: true, status: existing.status });
  }

  const processedAt = new Date().toISOString();
  try {
    if (!event.successful) {
      const reversal = /refund|reversed/.test(event.state)
        ? "refunded"
        : /chargeback|dispute/.test(event.state)
          ? "chargeback"
          : null;
      await tables.updateRow({
        databaseId: config.databaseId,
        tableId: STEPWISE_TABLES.orders,
        rowId: order.$id,
        data: {
          status: `provider_${event.state}`.slice(0, 64),
          updatedAt: processedAt,
          ...(event.providerOrderId || order.providerOrderId
            ? { providerOrderId: event.providerOrderId || order.providerOrderId }
            : {}),
        },
      });
      if (reversal) {
        await tables.updateRow({
          databaseId: config.databaseId,
          tableId: STEPWISE_TABLES.subscriptions,
          rowId: String(order.userId),
          data: { status: reversal, expiresAt: processedAt, updatedAt: processedAt },
        }).catch(() => undefined);
        const authUser = await users.get({ userId: String(order.userId) });
        await users.updateLabels({
          userId: authUser.$id,
          labels: authUser.labels.filter((label) => label !== "subscriber"),
        });
      }
      await tables.updateRow({
        databaseId: config.databaseId,
        tableId: STEPWISE_TABLES.paymentEvents,
        rowId: paymentEventId,
        data: { status: "processed", processedAt },
      });
      return NextResponse.json({ received: true, processed: false });
    }

    if (order.status === "paid") {
      await tables.updateRow({
        databaseId: config.databaseId,
        tableId: STEPWISE_TABLES.paymentEvents,
        rowId: paymentEventId,
        data: { status: "processed", processedAt },
      });
      return NextResponse.json({ duplicateOrderCompletion: true });
    }
    if (!isCommercialPlanId(order.planId)) throw new Error("Order plan is invalid");
    const plan = getCommercialPlan(order.planId);
    if (Number(order.amount) !== plan.amountCents || String(order.currency) !== plan.currency) {
      throw new Error("Order amount or currency does not match the signed server catalog");
    }

    let existingExpiry: string | undefined;
    try {
      const subscription = await tables.getRow({
        databaseId: config.databaseId,
        tableId: STEPWISE_TABLES.subscriptions,
        rowId: String(order.userId),
      });
      existingExpiry = typeof subscription.expiresAt === "string" ? subscription.expiresAt : undefined;
    } catch (error) {
      if (!(error instanceof AppwriteException) || error.code !== 404) throw error;
    }
    const expiresAt = extendSubscriptionExpiry(existingExpiry, plan.accessDays);
    const subscriptionData = {
      userId: String(order.userId),
      planId: order.planId,
      status: "active",
      startsAt: processedAt,
      expiresAt,
      sourceOrderId: order.$id,
      updatedAt: processedAt,
    };
    try {
      await tables.updateRow({
        databaseId: config.databaseId,
        tableId: STEPWISE_TABLES.subscriptions,
        rowId: String(order.userId),
        data: subscriptionData,
      });
    } catch (error) {
      if (!(error instanceof AppwriteException) || error.code !== 404) throw error;
      await tables.createRow({
        databaseId: config.databaseId,
        tableId: STEPWISE_TABLES.subscriptions,
        rowId: String(order.userId),
        permissions: [Permission.read(Role.user(String(order.userId)))],
        data: subscriptionData,
      });
    }

    const authUser = await users.get({ userId: String(order.userId) });
    if (!authUser.labels.includes("subscriber")) {
      await users.updateLabels({
        userId: authUser.$id,
        labels: [...authUser.labels, "subscriber"],
      });
    }
    await tables.updateRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.orders,
      rowId: order.$id,
      data: {
        status: "paid",
        paidAt: processedAt,
        updatedAt: processedAt,
        ...(event.providerOrderId || order.providerOrderId
          ? { providerOrderId: event.providerOrderId || order.providerOrderId }
          : {}),
      },
    });
    await tables.updateRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.paymentEvents,
      rowId: paymentEventId,
      data: { status: "processed", processedAt },
    });
    await sendPaymentReceiptEmail({
      orderId: order.$id,
      to: authUser.email,
      name: authUser.name,
      planName: plan.name,
      amountCents: plan.amountCents,
      currency: plan.currency,
      expiresAt,
    });
    await logAuditEvent({
      event: "webhook.safepay.payment_confirmed",
      actorUserId: authUser.$id,
      targetType: "order",
      targetId: order.$id,
      details: { planId: order.planId, providerEventId: event.providerEventId },
    });
    return NextResponse.json({ success: true, processed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    await tables.updateRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.paymentEvents,
      rowId: paymentEventId,
      data: { status: "failed", processedAt, lastError: message.slice(0, 16_000) },
    }).catch(() => undefined);
    await tables.updateRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.orders,
      rowId: order.$id,
      data: { status: "pending_reconciliation", updatedAt: processedAt },
    }).catch(() => undefined);
    await logAuditEvent({
      event: "webhook.safepay.processing_failed",
      level: "error",
      targetType: "order",
      targetId: order.$id,
      details: { message },
    });
    return NextResponse.json({ error: "Payment requires reconciliation" }, { status: 500 });
  }
}
