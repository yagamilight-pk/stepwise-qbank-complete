import { AppwriteException } from "node-appwrite";
import { NextResponse } from "next/server";
import { createAdminServices, getCurrentAppwriteUser, isAppwriteAdminConfigured, STEPWISE_TABLES } from "@/lib/appwrite-server";
import { hasActiveSubscription } from "@/lib/commercial";

export async function GET() {
  const user = await getCurrentAppwriteUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAppwriteAdminConfigured()) {
    return NextResponse.json({ configured: false, active: false, subscription: null });
  }
  const { tables, config } = createAdminServices();
  try {
    const subscription = await tables.getRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.subscriptions,
      rowId: user.$id,
    });
    const subscriptionData = subscription as unknown as Record<string, unknown>;
    return NextResponse.json({
      configured: true,
      active: hasActiveSubscription({
        status: subscriptionData.status,
        expiresAt: subscriptionData.expiresAt,
      }),
      subscription: {
        planId: subscriptionData.planId,
        status: subscriptionData.status,
        startsAt: subscriptionData.startsAt,
        expiresAt: subscriptionData.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return NextResponse.json({ configured: true, active: false, subscription: null });
    }
    return NextResponse.json({ error: "Unable to load subscription" }, { status: 502 });
  }
}
