import { NextResponse } from "next/server";
import {
  getAppwriteConfig,
  isAppwriteAdminConfigured,
  isAppwriteConfigured,
} from "@/lib/appwrite-server";
import { getMerchantIdentityReadiness } from "@/lib/merchant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ready = new URL(request.url).searchParams.get("ready") === "1";
  if (!ready) {
    return NextResponse.json({
      status: "ok",
      service: "stepwise-web",
      timestamp: new Date().toISOString(),
    });
  }

  if (!isAppwriteConfigured()) {
    return NextResponse.json(
      { status: "not_ready", checks: { appwrite: "not_configured" } },
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
    const checkoutEnabled = process.env.ENABLE_SAFEPAY_CHECKOUT === "true";
    const webhookEnabled = process.env.ENABLE_SAFEPAY_WEBHOOK === "true";
    const merchant = getMerchantIdentityReadiness();
    const checks = {
      appwrite: "reachable",
      normalizedData: isAppwriteAdminConfigured() ? "configured" : "not_configured",
      authEmail: process.env.APPWRITE_SMTP_CONFIGURED === "true" ? "configured" : "not_configured",
      transactionalEmail: process.env.RESEND_API_KEY ? "configured" : "not_configured",
      merchantIdentity: merchant.ready ? "configured" : "incomplete",
      merchantIdentityMissing: merchant.missingLabels,
      checkout: checkoutEnabled
        ? !merchant.ready
          ? "blocked_by_merchant_identity"
          : process.env.SAFEPAY_API_KEY ? "configured" : "missing_key"
        : "disabled",
      paymentWebhook: webhookEnabled
        ? process.env.SAFEPAY_WEBHOOK_SECRET ? "configured" : "missing_secret"
        : "disabled",
      telemetry: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
        ? "configured"
        : "optional_not_configured",
    };
    const readyForTraffic = checks.normalizedData === "configured"
      && checks.authEmail === "configured"
      && checks.transactionalEmail === "configured"
      && checks.checkout !== "missing_key"
      && checks.checkout !== "blocked_by_merchant_identity"
      && checks.paymentWebhook !== "missing_secret";
    return NextResponse.json(
      { status: readyForTraffic ? "ready" : "not_ready", checks },
      { status: readyForTraffic ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      { status: "not_ready", checks: { appwrite: "unreachable" } },
      { status: 503 },
    );
  }
}
