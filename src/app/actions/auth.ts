"use server";

import { cookies, headers } from "next/headers";
import { ID } from "node-appwrite";
import {
  createPublicAccount,
  createSessionServices,
  getAppwriteConfig,
  getAppwriteSessionCookieName,
  isAppwriteConfigured,
} from "@/lib/appwrite-server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function publicAuthError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/already exists|user.*exist|duplicate/i.test(message)) return "An account with this email already exists.";
  if (/invalid credentials|invalid email or password|user_invalid_credentials/i.test(message)) return "Invalid email or password.";
  if (/password/i.test(message) && /invalid|weak|length|policy/i.test(message)) return "Use a stronger password with at least 8 characters.";
  if (/rate|too many/i.test(message)) return "Too many attempts. Please wait and try again.";
  if (/expired|invalid.*(secret|token)|not found/i.test(message)) return "This link is invalid or has expired.";
  return fallback;
}

async function setSessionCookie(secret: string, expire: string) {
  const config = getAppwriteConfig();
  const cookieStore = await cookies();
  cookieStore.set(getAppwriteSessionCookieName(config.projectId), secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(expire),
    path: "/",
  });
}

function validateCredentials(email: string, password: string) {
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address.";
  if (password.length < 8 || password.length > 256) return "Use a password with at least 8 characters.";
  return null;
}

export async function signInWithEmailPassword(email: string, password: string): Promise<AuthActionResult> {
  if (!isAppwriteConfigured()) return { success: false, error: "Authentication is not configured." };
  const validationError = validateCredentials(email, password);
  if (validationError) return { success: false, error: validationError };

  try {
    const session = await createPublicAccount().createEmailPasswordSession({
      email: normalizeEmail(email),
      password,
    });
    if (!session.secret) throw new Error("Appwrite did not return a server session secret.");
    await setSessionCookie(session.secret, session.expire);
    return { success: true };
  } catch (error) {
    return { success: false, error: publicAuthError(error, "Unable to sign in right now.") };
  }
}

export async function signUpWithEmailPassword(name: string, email: string, password: string): Promise<AuthActionResult> {
  if (!isAppwriteConfigured()) return { success: false, error: "Authentication is not configured." };
  const validationError = validateCredentials(email, password);
  if (validationError) return { success: false, error: validationError };
  if (!name.trim() || name.trim().length > 120) return { success: false, error: "Enter your full name." };

  try {
    const account = createPublicAccount();
    await account.create({
      userId: ID.unique(),
      email: normalizeEmail(email),
      password,
      name: name.trim(),
    });
    const session = await account.createEmailPasswordSession({
      email: normalizeEmail(email),
      password,
    });
    if (!session.secret) throw new Error("Appwrite did not return a server session secret.");
    await setSessionCookie(session.secret, session.expire);
    return { success: true };
  } catch (error) {
    return { success: false, error: publicAuthError(error, "Unable to create your account right now.") };
  }
}

export async function signOut(): Promise<AuthActionResult> {
  if (!isAppwriteConfigured()) return { success: true };
  const config = getAppwriteConfig();
  const cookieStore = await cookies();
  try {
    const services = await createSessionServices();
    await services?.account.deleteSession({ sessionId: "current" });
  } catch {
    // Always clear the host cookie even if the upstream session already expired.
  }
  cookieStore.delete(getAppwriteSessionCookieName(config.projectId));
  return { success: true };
}

async function publicBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function requestPasswordRecovery(email: string): Promise<AuthActionResult> {
  if (!isAppwriteConfigured()) return { success: false, error: "Authentication is not configured." };
  if (!EMAIL_PATTERN.test(email.trim())) return { success: false, error: "Enter a valid email address." };
  try {
    await createPublicAccount().createRecovery({
      email: normalizeEmail(email),
      url: `${await publicBaseUrl()}/reset-password`,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/not.*found|unknown user/i.test(message)) return { success: true };
    return { success: false, error: publicAuthError(error, "Unable to send a reset link right now.") };
  }
}

export async function completePasswordRecovery(userId: string, secret: string, password: string): Promise<AuthActionResult> {
  if (!isAppwriteConfigured()) return { success: false, error: "Authentication is not configured." };
  if (!userId || !secret || userId.length > 128 || secret.length > 512) return { success: false, error: "This link is invalid or has expired." };
  if (password.length < 8 || password.length > 256) return { success: false, error: "Use a password with at least 8 characters." };
  try {
    await createPublicAccount().updateRecovery({ userId, secret, password });
    return { success: true };
  } catch (error) {
    return { success: false, error: publicAuthError(error, "Unable to reset your password.") };
  }
}
