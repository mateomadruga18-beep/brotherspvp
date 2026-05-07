import "server-only";
import { env } from "../env";

function normalizeOrigin(value: string) {
  return new URL(value).origin;
}

function matchesPattern(origin: string, pattern: string) {
  if (!pattern.includes("*.")) {
    return origin === pattern;
  }

  const parsedOrigin = new URL(origin);
  const parsedPattern = new URL(pattern.replace("*.", ""));
  if (parsedOrigin.protocol !== parsedPattern.protocol) {
    return false;
  }

  return (
    parsedOrigin.hostname === parsedPattern.hostname ||
    parsedOrigin.hostname.endsWith(`.${parsedPattern.hostname}`)
  );
}

export function isTrustedOrigin(origin: string | null) {
  if (!origin) return false;

  try {
    const normalized = normalizeOrigin(origin);
    return env.trustedOrigins.some((pattern) => matchesPattern(normalized, pattern));
  } catch {
    return false;
  }
}

export function getCorsHeaders(origin: string | null) {
  if (!origin || !isTrustedOrigin(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": normalizeOrigin(origin),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, X-Requested-With, X-Request-Id, X-Webhook-Secret, X-Signature",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}
