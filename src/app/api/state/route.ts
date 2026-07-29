import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { AppwriteException, Permission, Role } from "node-appwrite";
import { createSessionServices, isAppwriteAdminConfigured, isAppwriteConfigured } from "@/lib/appwrite-server";
import { LEARNER_STATE_SCHEMA_VERSION, parseLearnerState, type LearnerState } from "@/lib/learner-state";
import { syncNormalizedLearnerData } from "@/lib/normalized-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_STATE_BYTES = 2_000_000;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function authenticatedServices() {
  if (!isAppwriteConfigured()) return null;
  const services = await createSessionServices();
  if (!services) return null;
  try {
    const user = await services.account.get();
    return { ...services, user };
  } catch {
    return null;
  }
}

export async function GET() {
  const services = await authenticatedServices();
  if (!services) return errorResponse("Unauthorized", 401);
  try {
    const row = await services.tables.getRow({
      databaseId: services.config.databaseId,
      tableId: services.config.userStateTableId,
      rowId: services.user.$id,
    });
    const state = parseLearnerState(JSON.parse(String(row.state)));
    if (!state) return errorResponse("Stored learner state is invalid", 502);
    return NextResponse.json({
      state,
      revision: Number(row.revision ?? 0),
      updatedAt: row.$updatedAt,
      normalized: isAppwriteAdminConfigured(),
      user: {
        name: services.user.name,
        email: services.user.email,
        emailVerified: services.user.emailVerification,
      },
    });
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return NextResponse.json({
        error: "State not found",
        revision: 0,
        normalized: isAppwriteAdminConfigured(),
        user: {
          name: services.user.name,
          email: services.user.email,
          emailVerified: services.user.emailVerification,
        },
      }, { status: 404 });
    }
    return errorResponse("Unable to load learner state", 502);
  }
}

export async function PUT(request: Request) {
  const services = await authenticatedServices();
  if (!services) return errorResponse("Unauthorized", 401);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_STATE_BYTES) return errorResponse("Learner state is too large", 413);

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }
  const envelope = requestBody && typeof requestBody === "object" && "state" in requestBody
    ? requestBody as { state: unknown; baseRevision?: unknown }
    : { state: requestBody, baseRevision: undefined };
  const state = parseLearnerState(envelope.state);
  if (!state) return errorResponse("Invalid learner state", 400);
  const baseRevision = envelope.baseRevision === undefined ? null : Number(envelope.baseRevision);
  if (baseRevision !== null && (!Number.isInteger(baseRevision) || baseRevision < 0)) {
    return errorResponse("Invalid learner-state revision", 400);
  }

  const serialized = JSON.stringify({ ...state, schemaVersion: LEARNER_STATE_SCHEMA_VERSION });
  if (new TextEncoder().encode(serialized).byteLength > MAX_STATE_BYTES) return errorResponse("Learner state is too large", 413);

  let previousState: LearnerState | null = null;
  let currentRevision = 0;
  let rowExists = false;
  try {
    const existing = await services.tables.getRow({
      databaseId: services.config.databaseId,
      tableId: services.config.userStateTableId,
      rowId: services.user.$id,
    });
    rowExists = true;
    currentRevision = Number(existing.revision ?? 0);
    previousState = parseLearnerState(JSON.parse(String(existing.state)));
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) {
      return errorResponse("Unable to compare learner state", 502);
    }
  }
  if (baseRevision !== null && baseRevision !== currentRevision) {
    return NextResponse.json({
      error: "Learner state changed on another device",
      revision: currentRevision,
    }, { status: 409 });
  }

  const nextRevision = currentRevision + 1;
  if (isAppwriteAdminConfigured()) {
    try {
      await syncNormalizedLearnerData({
        user: services.user,
        state,
        previousState,
        revision: nextRevision,
      });
    } catch (error) {
      console.error("Normalized learner synchronization failed", {
        userId: services.user.$id,
        message: error instanceof Error ? error.message : "unknown",
      });
      return errorResponse("Unable to synchronize learner records", 502);
    }
  }

  const data = {
    schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
    state: serialized,
    revision: nextRevision,
    checksum: crypto.createHash("sha256").update(serialized).digest("hex"),
  };
  if (rowExists) {
    try {
      const row = await services.tables.updateRow({
        databaseId: services.config.databaseId,
        tableId: services.config.userStateTableId,
        rowId: services.user.$id,
        data,
      });
      return NextResponse.json({
        updatedAt: row.$updatedAt,
        revision: nextRevision,
        normalized: isAppwriteAdminConfigured(),
      });
    } catch {
      return errorResponse("Unable to save learner state", 502);
    }
  }

  try {
    const row = await services.tables.updateRow({
      databaseId: services.config.databaseId,
      tableId: services.config.userStateTableId,
      rowId: services.user.$id,
      data,
    });
    return NextResponse.json({
      updatedAt: row.$updatedAt,
      revision: nextRevision,
      normalized: isAppwriteAdminConfigured(),
    });
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) return errorResponse("Unable to save learner state", 502);
  }

  try {
    const row = await services.tables.createRow({
      databaseId: services.config.databaseId,
      tableId: services.config.userStateTableId,
      rowId: services.user.$id,
      data,
      permissions: [
        Permission.read(Role.user(services.user.$id)),
        Permission.update(Role.user(services.user.$id)),
        Permission.delete(Role.user(services.user.$id)),
      ],
    });
    return NextResponse.json({
      updatedAt: row.$updatedAt,
      revision: nextRevision,
      normalized: isAppwriteAdminConfigured(),
    }, { status: 201 });
  } catch {
    return errorResponse("Unable to initialize learner state", 502);
  }
}
