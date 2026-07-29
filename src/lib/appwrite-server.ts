import "server-only";

import { cookies } from "next/headers";
import { Account, Client, TablesDB, Users } from "node-appwrite";

export const STEPWISE_TABLES = {
  userStates: "user_states",
  profiles: "learner_profiles",
  attempts: "learner_attempts",
  sessions: "learner_sessions",
  artifacts: "learner_artifacts",
  mastery: "learner_mastery",
  subscriptions: "subscriptions",
  orders: "orders",
  paymentEvents: "payment_events",
  supportTickets: "support_tickets",
  emailEvents: "email_events",
  auditEvents: "audit_events",
  itemStatistics: "item_statistics",
  questions: "question_versions",
} as const;

export interface AppwriteRuntimeConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  userStateTableId: string;
  apiKey?: string;
}

const env = {
  endpoint: process.env.APPWRITE_ENDPOINT?.trim(),
  projectId: process.env.APPWRITE_PROJECT_ID?.trim(),
  databaseId: process.env.APPWRITE_DATABASE_ID?.trim(),
  userStateTableId: process.env.APPWRITE_USER_STATE_TABLE_ID?.trim(),
  apiKey: process.env.APPWRITE_API_KEY?.trim(),
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

export function createAuthAccount() {
  const config = getAppwriteConfig();
  if (!config.apiKey) {
    throw new Error("Appwrite authentication server key is not configured.");
  }
  return new Account(createClient().setKey(config.apiKey));
}

export function createAccountWithSession(secret: string) {
  return new Account(createClient().setSession(secret));
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

export function isAppwriteAdminConfigured() {
  return Boolean(isAppwriteConfigured() && env.apiKey);
}

export function createAdminServices() {
  const config = getAppwriteConfig();
  if (!config.apiKey) {
    throw new Error("Appwrite admin runtime configuration is incomplete.");
  }
  const client = createClient().setKey(config.apiKey);
  return {
    users: new Users(client),
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
