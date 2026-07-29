import { after, NextResponse } from "next/server";
import { ID, Permission, Query, Role } from "node-appwrite";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";
import {
  createAdminServices,
  getCurrentAppwriteUser,
  isAppwriteAdminConfigured,
  STEPWISE_TABLES,
} from "@/lib/appwrite-server";
import { sendSupportAcknowledgement, sendSupportNotification } from "@/lib/email";

export const runtime = "nodejs";

const ticketSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  category: z.enum(["Account", "Billing", "Question content", "Technical", "Accessibility", "Other"]),
  subject: z.string().trim().min(4).max(240),
  message: z.string().trim().min(20).max(8_000),
  sourceUrl: z.string().url().max(2_000).optional().or(z.literal("")),
  startedAt: z.number().int().positive(),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  if (!isAppwriteAdminConfigured()) {
    return NextResponse.json(
      { error: "Support requests are temporarily unavailable. Please email support@stepwise.page." },
      { status: 503 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 32_768) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the support fields." }, { status: 400 });
  }

  const elapsed = Date.now() - parsed.data.startedAt;
  if (parsed.data.website || elapsed < 2_000 || elapsed > 86_400_000) {
    return NextResponse.json({ error: "Unable to accept this request. Please refresh and try again." }, { status: 400 });
  }

  const { tables, config } = createAdminServices();
  const user = await getCurrentAppwriteUser();
  const windowStart = new Date(Date.now() - 60 * 60 * 1_000).toISOString();
  const recent = await tables.listRows({
    databaseId: config.databaseId,
    tableId: STEPWISE_TABLES.supportTickets,
    queries: [
      Query.equal("email", parsed.data.email),
      Query.greaterThanEqual("createdAt", windowStart),
      Query.limit(6),
    ],
  });
  if (recent.rows.length >= 5) {
    return NextResponse.json(
      { error: "Too many recent requests. Please wait or email support@stepwise.page." },
      { status: 429 },
    );
  }

  const ticketId = ID.unique();
  const now = new Date().toISOString();
  const permissions = user ? [Permission.read(Role.user(user.$id))] : [];
  const data: Record<string, string> = {
    name: parsed.data.name,
    email: parsed.data.email,
    category: parsed.data.category,
    subject: parsed.data.subject,
    message: parsed.data.message,
    status: "open",
    priority: "normal",
    createdAt: now,
    updatedAt: now,
  };
  if (user) data.userId = user.$id;
  if (parsed.data.sourceUrl) data.sourceUrl = parsed.data.sourceUrl;

  await tables.createRow({
    databaseId: config.databaseId,
    tableId: STEPWISE_TABLES.supportTickets,
    rowId: ticketId,
    data,
    permissions,
  });

  after(async () => {
    await Promise.allSettled([
      sendSupportAcknowledgement({
        ticketId,
        to: parsed.data.email,
        name: parsed.data.name,
        subject: parsed.data.subject,
      }),
      sendSupportNotification({
        ticketId,
        from: parsed.data.email,
        subject: parsed.data.subject,
        category: parsed.data.category,
        message: parsed.data.message,
      }),
      logAuditEvent({
        event: "support.ticket.created",
        actorUserId: user?.$id,
        targetType: "support_ticket",
        targetId: ticketId,
        details: { category: parsed.data.category, authenticated: Boolean(user) },
      }),
    ]);
  });

  return NextResponse.json({ ticketId }, { status: 201 });
}
