import "server-only";

import crypto from "node:crypto";
import { createAdminServices, isAppwriteAdminConfigured, STEPWISE_TABLES } from "./appwrite-server";

type TransactionalEmail = {
  to: string;
  subject: string;
  heading: string;
  bodyHtml: string;
  bodyText: string;
  idempotencyKey: string;
  replyTo?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailShell(preview: string, heading: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(preview)}</title></head><body style="margin:0;background:#f4f5f9;color:#1d2030;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e2e4eb;border-radius:18px"><tr><td style="padding:28px 32px 12px;font-size:20px;font-weight:800;color:#6756e8">STEPWISE</td></tr><tr><td style="padding:8px 32px 12px"><h1 style="margin:0;font-size:26px">${escapeHtml(heading)}</h1></td></tr><tr><td style="padding:8px 32px 32px;font-size:15px;line-height:1.7;color:#5a6072">${body}</td></tr><tr><td style="border-top:1px solid #e6e8ee;padding:18px 32px;font-size:12px;line-height:1.6;color:#7b8191">Need help? Reply to this email or contact <a href="mailto:support@stepwise.page" style="color:#6756e8">support@stepwise.page</a>.</td></tr></table></td></tr></table></body></html>`;
}

function eventId(idempotencyKey: string) {
  return crypto.createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 32);
}

async function recordEmailEvent(input: {
  idempotencyKey: string;
  kind: string;
  to: string;
  status: "sent" | "failed" | "skipped";
  providerMessageId?: string;
}) {
  if (!isAppwriteAdminConfigured()) return;
  const { tables, config } = createAdminServices();
  const rowId = eventId(input.idempotencyKey);
  const data = {
    idempotencyKey: input.idempotencyKey.slice(0, 255),
    kind: input.kind.slice(0, 80),
    recipientHash: crypto.createHash("sha256").update(input.to.toLowerCase()).digest("hex"),
    status: input.status,
    createdAt: new Date().toISOString(),
    ...(input.providerMessageId ? { providerMessageId: input.providerMessageId.slice(0, 255) } : {}),
  };
  try {
    await tables.createRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.emailEvents,
      rowId,
      data,
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 409) {
      console.error("Unable to record email delivery event", { rowId });
    }
  }
}

export async function sendTransactionalEmail(payload: TransactionalEmail) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const kind = payload.idempotencyKey.split("/")[0] || "transactional";
  if (!apiKey) {
    await recordEmailEvent({ ...payload, kind, status: "skipped" });
    return { sent: false as const, reason: "provider_not_configured" as const };
  }

  const from = process.env.EMAIL_FROM?.trim() || "Stepwise <noreply@stepwise.page>";
  const replyTo = payload.replyTo || process.env.EMAIL_REPLY_TO?.trim() || "support@stepwise.page";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "idempotency-key": payload.idempotencyKey.slice(0, 256),
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        reply_to: replyTo,
        subject: payload.subject,
        html: emailShell(payload.subject, payload.heading, payload.bodyHtml),
        text: payload.bodyText,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      await recordEmailEvent({ ...payload, kind, status: "failed" });
      console.error("Transactional email provider rejected request", {
        status: response.status,
        idempotencyKey: payload.idempotencyKey,
      });
      return { sent: false as const, reason: "provider_rejected" as const };
    }
    const result = await response.json() as { id?: string };
    await recordEmailEvent({
      ...payload,
      kind,
      status: "sent",
      providerMessageId: result.id,
    });
    return { sent: true as const, providerMessageId: result.id };
  } catch (error) {
    await recordEmailEvent({ ...payload, kind, status: "failed" });
    console.error("Transactional email delivery failed", {
      message: error instanceof Error ? error.message : "unknown",
      idempotencyKey: payload.idempotencyKey,
    });
    return { sent: false as const, reason: "delivery_failed" as const };
  }
}

export function sendWelcomeEmail(user: { id: string; email: string; name?: string }) {
  const name = escapeHtml(user.name || "there");
  return sendTransactionalEmail({
    to: user.email,
    subject: "Welcome to Stepwise",
    heading: "Your learning workspace is ready",
    idempotencyKey: `welcome/${user.id}`,
    bodyHtml: `<p>Hi ${name},</p><p>Your Stepwise account is ready. Build your first question block, review each reasoning correction, and let your real attempt history shape what comes next.</p><p><a href="https://app.stepwise.page/app" style="display:inline-block;background:#6756e8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:700">Open Stepwise</a></p>`,
    bodyText: `Hi ${user.name || "there"}, your Stepwise learning workspace is ready. Open it at https://app.stepwise.page/app`,
  });
}

export function sendSupportAcknowledgement(input: { ticketId: string; to: string; name?: string; subject: string }) {
  return sendTransactionalEmail({
    to: input.to,
    subject: `We received your Stepwise request (${input.ticketId})`,
    heading: "Your support request is in the queue",
    idempotencyKey: `support-ack/${input.ticketId}`,
    bodyHtml: `<p>Hi ${escapeHtml(input.name || "there")},</p><p>We received your request about <strong>${escapeHtml(input.subject)}</strong>. Keep reference <code>${escapeHtml(input.ticketId)}</code> if you reply with more information.</p>`,
    bodyText: `We received your Stepwise support request about ${input.subject}. Reference: ${input.ticketId}.`,
  });
}

export function sendSupportNotification(input: {
  ticketId: string;
  from: string;
  subject: string;
  category: string;
  message: string;
}) {
  const inbox = process.env.SUPPORT_INBOX_EMAIL?.trim() || "support@stepwise.page";
  return sendTransactionalEmail({
    to: inbox,
    replyTo: input.from,
    subject: `[${input.category}] ${input.subject}`,
    heading: `New support request ${input.ticketId}`,
    idempotencyKey: `support-notify/${input.ticketId}`,
    bodyHtml: `<p><strong>From:</strong> ${escapeHtml(input.from)}</p><p>${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>`,
    bodyText: `From: ${input.from}\n\n${input.message}`,
  });
}

export function sendPaymentReceiptEmail(input: {
  orderId: string;
  to: string;
  name?: string;
  planName: string;
  amountCents: number;
  currency: string;
  expiresAt: string;
}) {
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: input.currency,
  }).format(input.amountCents / 100);
  return sendTransactionalEmail({
    to: input.to,
    subject: `Stepwise receipt — ${amount}`,
    heading: "Your access is active",
    idempotencyKey: `payment-receipt/${input.orderId}`,
    bodyHtml: `<p>Hi ${escapeHtml(input.name || "there")},</p><p>Your <strong>${escapeHtml(input.planName)}</strong> access is active through ${escapeHtml(new Date(input.expiresAt).toLocaleDateString("en-US", { dateStyle: "long" }))}.</p><p><strong>Amount:</strong> ${escapeHtml(amount)}<br><strong>Order:</strong> <code>${escapeHtml(input.orderId)}</code></p>`,
    bodyText: `Your ${input.planName} Stepwise access is active through ${input.expiresAt}. Amount: ${amount}. Order: ${input.orderId}.`,
  });
}
