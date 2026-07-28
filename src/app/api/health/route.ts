import { NextResponse } from "next/server";
import { getAppwriteConfig, isAppwriteConfigured } from "@/lib/appwrite-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAppwriteConfigured()) {
    return NextResponse.json(
      { status: "degraded", appwrite: "not_configured" },
      { status: 503 },
    );
  }

  const config = getAppwriteConfig();
  try {
    const response = await fetch(`${config.endpoint.replace(/\/$/, "")}/health/version`, {
      headers: { "x-appwrite-project": config.projectId },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Appwrite health returned ${response.status}`);
    return NextResponse.json({ status: "ok", appwrite: "reachable" });
  } catch {
    return NextResponse.json(
      { status: "degraded", appwrite: "unreachable" },
      { status: 503 },
    );
  }
}
