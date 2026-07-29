import "server-only";

import crypto from "node:crypto";

export type SafepayEnvironment = "sandbox" | "production";

export function getSafepayEnvironment(value: unknown): SafepayEnvironment {
  return value === "production" ? "production" : "sandbox";
}

export function getSafepayApiBase(environment: SafepayEnvironment) {
  return environment === "production"
    ? "https://api.getsafepay.com"
    : "https://sandbox.api.getsafepay.com";
}

export function getSafepayCheckoutBase(environment: SafepayEnvironment) {
  return environment === "production"
    ? "https://getsafepay.com/checkout/pay"
    : "https://sandbox.api.getsafepay.com/checkout/pay";
}

export function verifySafepaySignature(rawBody: string, signature: string, secret: string) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const normalized = signature.trim().toLowerCase();
  if (!/^[a-f0-9]+$/.test(normalized) || normalized.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(normalized, "hex"), Buffer.from(expected, "hex"));
}

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function firstString(...values: unknown[]) {
  const candidate = values.find((value) => typeof value === "string" && value.trim());
  return typeof candidate === "string" ? candidate.trim().slice(0, 255) : "";
}

export function parseSafepayWebhook(payload: Record<string, unknown>, rawBody: string, eventHeader = "") {
  const data = record(payload.data);
  const trackerRecord = record(payload.tracker);
  const dataTrackerRecord = record(data.tracker);
  const tracker = firstString(trackerRecord.token, dataTrackerRecord.token, payload.tracker, data.tracker);
  const state = firstString(payload.event, payload.type, payload.status, payload.state, data.status, data.state, "payment.completed").toLowerCase();
  const providerOrderId = firstString(payload.order_id, data.order_id);
  const providerEventId = firstString(
    eventHeader,
    payload.event_id,
    payload.id,
    data.event_id,
    providerOrderId && `${providerOrderId}:${state}`,
    crypto.createHash("sha256").update(rawBody).digest("hex"),
  );
  const successfulStates = new Set([
    "paid",
    "complete",
    "completed",
    "success",
    "succeeded",
    "payment.completed",
    "payment.succeeded",
  ]);
  return {
    tracker,
    state,
    providerOrderId,
    providerEventId,
    payloadHash: crypto.createHash("sha256").update(rawBody).digest("hex"),
    successful: successfulStates.has(state),
  };
}
