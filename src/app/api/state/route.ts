import { NextResponse } from "next/server";
import { AppwriteException, Permission, Role } from "node-appwrite";
import { createSessionServices, isAppwriteConfigured } from "@/lib/appwrite-server";
import { isLearnerState, LEARNER_STATE_SCHEMA_VERSION } from "@/lib/learner-state";

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
    const state: unknown = JSON.parse(String(row.state));
    if (!isLearnerState(state)) return errorResponse("Stored learner state is invalid", 502);
    return NextResponse.json({
      state,
      updatedAt: row.$updatedAt,
      user: { name: services.user.name, email: services.user.email },
    });
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return NextResponse.json({
        error: "State not found",
        user: { name: services.user.name, email: services.user.email },
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

  let state: unknown;
  try {
    state = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }
  if (!isLearnerState(state)) return errorResponse("Invalid learner state", 400);

  const serialized = JSON.stringify({ ...state, schemaVersion: LEARNER_STATE_SCHEMA_VERSION });
  if (new TextEncoder().encode(serialized).byteLength > MAX_STATE_BYTES) return errorResponse("Learner state is too large", 413);

  const data = {
    schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
    state: serialized,
  };
  try {
    const row = await services.tables.updateRow({
      databaseId: services.config.databaseId,
      tableId: services.config.userStateTableId,
      rowId: services.user.$id,
      data,
    });
    return NextResponse.json({ updatedAt: row.$updatedAt });
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
    return NextResponse.json({ updatedAt: row.$updatedAt }, { status: 201 });
  } catch {
    return errorResponse("Unable to initialize learner state", 502);
  }
}
