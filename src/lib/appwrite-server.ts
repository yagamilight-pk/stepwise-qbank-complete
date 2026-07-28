import "server-only";

import { cookies } from "next/headers";
import { Account, Client, TablesDB } from "node-appwrite";

export interface AppwriteRuntimeConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  userStateTableId: string;
}

const env = {
  endpoint: process.env.APPWRITE_ENDPOINT?.trim(),
  projectId: process.env.APPWRITE_PROJECT_ID?.trim(),
  databaseId: process.env.APPWRITE_DATABASE_ID?.trim(),
  userStateTableId: process.env.APPWRITE_USER_STATE_TABLE_ID?.trim(),
};

export function isAppwriteConfigured() {
  return Boolean(env.endpoint && env.projectId && env.databaseId && env.userStateTableId);
}

export function getAppwriteConfig(): AppwriteRuntimeConfig {
  if (!isAppwriteConfigured()) {
    throw new Error("Appwrite runtime configuration is incomplete.");
  }
  return env as AppwriteRuntimeConfig;
}

export function getAppwriteSessionCookieName(projectId = getAppwriteConfig().projectId) {
  return `a_session_${projectId}`;
}

function createClient() {
  const config = getAppwriteConfig();
  return new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId);
}

export function createPublicAccount() {
  return new Account(createClient());
}

export async function createSessionServices() {
  const config = getAppwriteConfig();
  const cookieStore = await cookies();
  const secret = cookieStore.get(getAppwriteSessionCookieName(config.projectId))?.value;
  if (!secret) return null;

  const client = createClient().setSession(secret);
  return {
    account: new Account(client),
    tables: new TablesDB(client),
    config,
  };
}

export async function getCurrentAppwriteUser() {
  if (!isAppwriteConfigured()) return null;
  const services = await createSessionServices();
  if (!services) return null;
  try {
    return await services.account.get();
  } catch {
    return null;
  }
}
