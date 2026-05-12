import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

export const ADMIN_SESSION_COOKIE = "brotherspvp_admin_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function sessionSecret() {
  return env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD || "";
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export function isAdminAuthConfigured() {
  return Boolean(env.ADMIN_PASSWORD && sessionSecret());
}

export function validateAdminPassword(value: FormDataEntryValue | null) {
  if (!isAdminAuthConfigured() || typeof value !== "string") {
    return false;
  }

  return constantTimeEqual(value, env.ADMIN_PASSWORD ?? "");
}

export function createAdminSessionToken() {
  const issuedAt = Date.now().toString();
  const nonce = randomBytes(18).toString("hex");
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/admin",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function verifyAdminSessionToken(token: string | undefined) {
  if (!isAdminAuthConfigured() || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [issuedAtRaw, nonce, signature] = parts;
  if (!issuedAtRaw || !nonce || !signature) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;

  const ageMs = Date.now() - issuedAt;
  if (ageMs < 0 || ageMs > SESSION_MAX_AGE_SECONDS * 1000) return false;

  const payload = `${issuedAtRaw}.${nonce}`;
  return constantTimeEqual(signature, sign(payload));
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
