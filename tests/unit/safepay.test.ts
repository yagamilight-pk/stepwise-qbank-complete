import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  getSafepayApiBase,
  getSafepayCheckoutBase,
  getSafepayEnvironment,
  parseSafepayWebhook,
  verifySafepaySignature,
} from "@/lib/safepay";

describe("Safepay boundary", () => {
  it("defaults unknown environments to sandbox", () => {
    expect(getSafepayEnvironment("production")).toBe("production");
    expect(getSafepayEnvironment("prod")).toBe("sandbox");
    expect(getSafepayApiBase("sandbox")).toContain("sandbox");
    expect(getSafepayApiBase("production")).toBe("https://api.getsafepay.com");
    expect(getSafepayCheckoutBase("sandbox")).toContain("sandbox");
    expect(getSafepayCheckoutBase("production")).toBe("https://getsafepay.com/checkout/pay");
  });

  it("verifies an exact HMAC-SHA512 signature using constant-length inputs", () => {
    const rawBody = JSON.stringify({ event: "payment.completed" });
    const secret = "test-secret";
    const signature = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    expect(verifySafepaySignature(rawBody, signature.toUpperCase(), secret)).toBe(true);
    expect(verifySafepaySignature(`${rawBody}x`, signature, secret)).toBe(false);
    expect(verifySafepaySignature(rawBody, "not-hex", secret)).toBe(false);
    expect(verifySafepaySignature(rawBody, "", secret)).toBe(false);
  });

  it("normalizes success and revocation events without trusting browser fields", () => {
    const paidBody = JSON.stringify({ event: "payment.completed", data: { tracker: { token: "trk_123" }, order_id: "ord_1" } });
    expect(parseSafepayWebhook(JSON.parse(paidBody), paidBody, "evt_1")).toMatchObject({
      tracker: "trk_123",
      state: "payment.completed",
      providerOrderId: "ord_1",
      providerEventId: "evt_1",
      successful: true,
    });
    const refundBody = JSON.stringify({ type: "payment.refunded", tracker: { token: "trk_456" } });
    const refund = parseSafepayWebhook(JSON.parse(refundBody), refundBody);
    expect(refund.successful).toBe(false);
    expect(refund.payloadHash).toHaveLength(64);
    expect(refund.providerEventId).toHaveLength(64);

    const unknownBody = JSON.stringify({ event: "payment.processing", data: { tracker: { token: "trk_789" } } });
    const unknown = parseSafepayWebhook(JSON.parse(unknownBody), unknownBody, "evt_unknown");
    expect(unknown.successful).toBe(false);
  });
});
