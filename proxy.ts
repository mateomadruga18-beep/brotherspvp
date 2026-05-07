import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

const API_METHODS = "GET, POST, OPTIONS";
const API_HEADERS = [
  "Content-Type",
  "X-Requested-With",
  "X-Request-Id",
  "X-Webhook-Secret",
  "X-Signature",
  "X-Request-ID",
  "PayPal-Transmission-Id",
  "PayPal-Transmission-Time",
  "PayPal-Transmission-Sig",
  "PayPal-Cert-Url",
  "PayPal-Auth-Algo",
].join(", ");

function buildCorsHeaders(origin: string | null) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": API_METHODS,
    "Access-Control-Allow-Headers": API_HEADERS,
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  });

  if (origin && isTrustedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

function trustedOrigins() {
  const values = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.BASE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ...(process.env.TRUSTED_ORIGINS?.split(",") ?? []),
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(values));
}

function isTrustedOrigin(origin: string) {
  try {
    const normalizedOrigin = new URL(origin).origin;
    return trustedOrigins().some((pattern) => {
      if (!pattern.includes("*.")) {
        return normalizedOrigin === new URL(pattern).origin;
      }

      const parsedOrigin = new URL(normalizedOrigin);
      const parsedPattern = new URL(pattern.replace("*.", ""));
      return (
        parsedOrigin.protocol === parsedPattern.protocol &&
        (parsedOrigin.hostname === parsedPattern.hostname ||
          parsedOrigin.hostname.endsWith(`.${parsedPattern.hostname}`))
      );
    });
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId = requestHeaders.get("x-store-request-id")?.trim() || randomUUID();
  requestHeaders.set("x-store-request-id", requestId);

  if (request.nextUrl.pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const origin = request.headers.get("origin");
    if (origin && !isTrustedOrigin(origin)) {
      return NextResponse.json(
        { ok: false, error: { code: "UNTRUSTED_ORIGIN", message: "Origin is not allowed." } },
        { status: 403 },
      );
    }

    const response = NextResponse.json(
      {},
      {
        status: 204,
        headers: buildCorsHeaders(origin),
      },
    );
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (request.nextUrl.pathname.startsWith("/api/")) {
    for (const [key, value] of buildCorsHeaders(request.headers.get("origin")).entries()) {
      response.headers.set(key, value);
    }
  }

  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
