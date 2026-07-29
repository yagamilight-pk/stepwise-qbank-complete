import "server-only";

import { ID } from "node-appwrite";
import { createAdminServices, isAppwriteAdminConfigured, STEPWISE_TABLES } from "./appwrite-server";

type AuditInput = {
  event: string;
  level?: "info" | "warn" | "error";
  actorUserId?: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
};

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.slice(0, 50).map(sanitize);
  if (!value || typeof value !== "object") {
    return typeof value === "string" ? value.slice(0, 1_000) : value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (/password|secret|token|cookie|authorization|questionText|selectedAnswer/i.test(key)) {
      result[key] = "[redacted]";
    } else {
      result[key] = sanitize(entry);
    }
  }
  return result;
}

export async function logAuditEvent(input: AuditInput) {
  const entry = {
    event: input.event.slice(0, 160),
    level: input.level ?? "info",
    details: JSON.stringify(sanitize(input.details ?? {})),
    createdAt: new Date().toISOString(),
    ...(input.actorUserId ? { actorUserId: input.actorUserId.slice(0, 64) } : {}),
    ...(input.targetType ? { targetType: input.targetType.slice(0, 80) } : {}),
    ...(input.targetId ? { targetId: input.targetId.slice(0, 128) } : {}),
  };
  console.info(JSON.stringify({ type: "stepwise_audit", ...entry }));
  if (!isAppwriteAdminConfigured()) return;
  try {
    const { tables, config } = createAdminServices();
    await tables.createRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.auditEvents,
      rowId: ID.unique(),
      data: entry,
    });
  } catch {
    console.error("Unable to persist Stepwise audit event", { event: entry.event });
  }
}
