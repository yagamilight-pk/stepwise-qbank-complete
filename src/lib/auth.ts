import "server-only";

import { redirect } from "next/navigation";
import { getCurrentAppwriteUser, isAppwriteConfigured } from "./appwrite-server";

export async function requireAppwriteUser(requiredLabel?: "admin" | "influencer") {
  if (!isAppwriteConfigured()) return null;

  const user = await getCurrentAppwriteUser();
  if (!user) redirect("/login");
  if (requiredLabel && !user.labels.includes(requiredLabel)) redirect("/app");
  return user;
}
