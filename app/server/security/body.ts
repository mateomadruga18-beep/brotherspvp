import "server-only";
import { securityLog } from "./log";
import type { RequestContext } from "./request";
import { badRequest, payloadTooLarge, unsupportedMediaType } from "../utils/apiResponse";

function isJsonContentType(contentType: string | null) {
  if (!contentType) return false;
  return (
    contentType.includes("application/json") ||
    contentType.includes("application/ld+json") ||
    contentType.includes("+json")
  );
}

export async function readJsonBody<T>(
  request: Request,
  context: RequestContext,
  options: { maxBytes: number; allowEmpty?: boolean },
): Promise<
  | { ok: true; value: T; raw: string }
  | { ok: false; response: Response }
> {
  const contentType = request.headers.get("content-type");
  if (!isJsonContentType(contentType)) {
    securityLog("warn", "invalid_content_type", {
      requestId: context.requestId,
      path: context.path,
      contentType,
    });
    return {
      ok: false,
      response: unsupportedMediaType(
        "UNSUPPORTED_MEDIA_TYPE",
        "Expected an application/json request body.",
        { request, requestId: context.requestId },
      ),
    };
  }

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
  if (Number.isFinite(contentLength) && contentLength > options.maxBytes) {
    securityLog("warn", "payload_too_large", {
      requestId: context.requestId,
      path: context.path,
      contentLength,
      maxBytes: options.maxBytes,
    });
    return {
      ok: false,
      response: payloadTooLarge("PAYLOAD_TOO_LARGE", "Request body is too large.", {
        request,
        requestId: context.requestId,
      }),
    };
  }

  const raw = await request.text();
  const rawBytes = Buffer.byteLength(raw, "utf8");
  if (rawBytes > options.maxBytes) {
    securityLog("warn", "payload_too_large", {
      requestId: context.requestId,
      path: context.path,
      contentLength: rawBytes,
      maxBytes: options.maxBytes,
    });
    return {
      ok: false,
      response: payloadTooLarge("PAYLOAD_TOO_LARGE", "Request body is too large.", {
        request,
        requestId: context.requestId,
      }),
    };
  }

  if (!raw.trim()) {
    if (options.allowEmpty) {
      return { ok: true, value: {} as T, raw };
    }
    return {
      ok: false,
      response: badRequest("EMPTY_BODY", "Request body is required.", {
        request,
        requestId: context.requestId,
      }),
    };
  }

  try {
    return { ok: true, value: JSON.parse(raw) as T, raw };
  } catch {
    securityLog("warn", "invalid_json", {
      requestId: context.requestId,
      path: context.path,
    });
    return {
      ok: false,
      response: badRequest("INVALID_JSON", "Malformed JSON payload.", {
        request,
        requestId: context.requestId,
      }),
    };
  }
}
