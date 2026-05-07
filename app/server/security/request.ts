import "server-only";
import { createHash, randomUUID } from "node:crypto";

export type RequestContext = {
  requestId: string;
  ip: string;
  ipHash: string;
  method: string;
  path: string;
  origin: string | null;
  userAgent: string | null;
};

function sanitizeIp(value: string | null) {
  if (!value) return "0.0.0.0";
  const trimmed = value.trim();
  if (!trimmed) return "0.0.0.0";

  if (trimmed.includes(",")) {
    return sanitizeIp(trimmed.split(",")[0] ?? null);
  }

  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    if (end > 0) return trimmed.slice(1, end);
  }

  const ipv4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/;
  const match = trimmed.match(ipv4WithPort);
  return match?.[1] ?? trimmed;
}

export function hashIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getRequestId(request: Request) {
  const existing =
    request.headers.get("x-store-request-id")?.trim()
    ?? request.headers.get("x-request-id")?.trim();
  if (existing && existing.length <= 100) {
    return existing;
  }
  return randomUUID();
}

export function getClientIp(request: Request) {
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  ];

  for (const candidate of candidates) {
    const ip = sanitizeIp(candidate);
    if (ip !== "0.0.0.0") {
      return ip;
    }
  }

  return "0.0.0.0";
}

function getOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const referer = request.headers.get("referer");
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function createRequestContext(request: Request): RequestContext {
  const url = new URL(request.url);
  const ip = getClientIp(request);

  return {
    requestId: getRequestId(request),
    ip,
    ipHash: hashIdentifier(ip),
    method: request.method.toUpperCase(),
    path: url.pathname,
    origin: getOrigin(request),
    userAgent: request.headers.get("user-agent"),
  };
}
