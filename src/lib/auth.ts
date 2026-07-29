import "server-only";

import { AppwriteException } from "node-appwrite";
import { redirect } from "next/navigation";
import {
  createAdminServices,
  getCurrentAppwriteUser,
  isAppwriteAdminConfigured,
  isAppwriteConfigured,
  STEPWISE_TABLES,
} from "./appwrite-server";
import { hasActiveSubscription } from "./commercial";

export async function requireAppwriteUser(requiredLabel?: "admin" | "influencer") {
  if (!isAppwriteConfigured()) return null;

  const user = await getCurrentAppwriteUser();
  if (!user) redirect("/login");
  if (requiredLabel && !user.labels.includes(requiredLabel)) redirect("/app");
  return user;
}

export async function requireLearnerAccess() {
  const user = await requireAppwriteUser();
  if (!user || process.env.ENFORCE_SUBSCRIPTIONS !== "true" || user.labels.includes("admin")) return user;
  if (!isAppwriteAdminConfigured()) redirect("/checkout?access=unavailable");

  const { tables, users, config } = createAdminServices();
  try {
    const subscription = await tables.getRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.subscriptions,
      rowId: user.$id,
    });
    const data = subscription as unknown as Record<string, unknown>;
    if (hasActiveSubscription({ status: data.status, expiresAt: data.expiresAt })) return user;
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) throw error;
  }

  if (user.labels.includes("subscriber")) {
    await users.updateLabels({
      userId: user.$id,
      labels: user.labels.filter(label => label !== "subscriber"),
    }).catch(() => undefined);
  }
  redirect("/checkout?access=required");
}
