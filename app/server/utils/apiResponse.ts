import { NextResponse } from "next/server";
import { env } from "../env";
import { getCorsHeaders } from "../security/origin";
import { securityLog } from "../security/log";

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { code: string; message: string } };

type ApiResponseOptions = {
  request?: Request;
  requestId?: string;
  retryAfterSeconds?: number;
  headers?: HeadersInit;
};

function buildHeaders(options?: ApiResponseOptions) {
  const headers = new Headers(options?.headers);
  headers.set("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
  headers.set("Pragma", "no-cache");

  if (options?.requestId) {
    headers.set("x-request-id", options.requestId);
  }

  if (options?.retryAfterSeconds) {
    headers.set("Retry-After", String(options.retryAfterSeconds));
  }

  if (options?.request) {
    for (const [key, value] of Object.entries(
      getCorsHeaders(options.request.headers.get("origin")),
    )) {
      headers.set(key, value);
    }
  }

  return headers;
}

function safeServerMessage(message: string) {
  return env.NODE_ENV === "production" ? "An internal server error occurred." : message;
}

export function ok<T>(data: T, init?: ResponseInit & ApiResponseOptions) {
  return NextResponse.json<ApiOk<T>>(
    { ok: true, data },
    {
      ...init,
      headers: buildHeaders(init),
    },
  );
}

export function badRequest(code: string, message: string, options?: ApiResponseOptions) {
  return NextResponse.json<ApiErr>(
    { ok: false, error: { code, message } },
    { status: 400, headers: buildHeaders(options) },
  );
}

export function forbidden(code: string, message: string, options?: ApiResponseOptions) {
  return NextResponse.json<ApiErr>(
    { ok: false, error: { code, message } },
    { status: 403, headers: buildHeaders(options) },
  );
}

export function unsupportedMediaType(code: string, message: string, options?: ApiResponseOptions) {
  return NextResponse.json<ApiErr>(
    { ok: false, error: { code, message } },
    { status: 415, headers: buildHeaders(options) },
  );
}

export function payloadTooLarge(code: string, message: string, options?: ApiResponseOptions) {
  return NextResponse.json<ApiErr>(
    { ok: false, error: { code, message } },
    { status: 413, headers: buildHeaders(options) },
  );
}

export function tooManyRequests(
  code: string,
  message: string,
  retryAfterSeconds: number,
  options?: ApiResponseOptions,
) {
  return NextResponse.json<ApiErr>(
    { ok: false, error: { code, message } },
    {
      status: 429,
      headers: buildHeaders({
        ...options,
        retryAfterSeconds,
      }),
    },
  );
}

export function notFound(code: string, message: string, options?: ApiResponseOptions) {
  return NextResponse.json<ApiErr>(
    { ok: false, error: { code, message } },
    { status: 404, headers: buildHeaders(options) },
  );
}

export function gatewayTimeout(code: string, message: string, options?: ApiResponseOptions) {
  return NextResponse.json<ApiErr>(
    { ok: false, error: { code, message } },
    { status: 504, headers: buildHeaders(options) },
  );
}

export function serverError(code: string, message: string, options?: ApiResponseOptions) {
  return NextResponse.json<ApiErr>(
    { ok: false, error: { code, message: safeServerMessage(message) } },
    { status: 500, headers: buildHeaders(options) },
  );
}

export function handleRouteError(
  error: unknown,
  options: ApiResponseOptions & {
    code: string;
    publicMessage: string;
    logEvent: string;
    logData?: Record<string, unknown>;
  },
) {
  securityLog("error", options.logEvent, {
    requestId: options.requestId,
    error,
    ...options.logData,
  });

  return serverError(options.code, options.publicMessage, options);
}
