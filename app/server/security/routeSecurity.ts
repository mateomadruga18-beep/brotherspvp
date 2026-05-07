import "server-only";
import { forbidden } from "../utils/apiResponse";
import { securityLog } from "./log";
import { isTrustedOrigin } from "./origin";
import type { RateLimitRule } from "./rateLimit";
import { enforceRateLimit } from "./rateLimit";
import { createRequestContext } from "./request";

export async function applyRouteSecurity(
  request: Request,
  options: {
    requireTrustedOrigin?: boolean;
    allowMissingOrigin?: boolean;
    rateLimits?: RateLimitRule[];
  } = {},
) {
  const context = createRequestContext(request);

  if (options.requireTrustedOrigin) {
    if (!context.origin && !options.allowMissingOrigin) {
      securityLog("warn", "missing_origin", {
        requestId: context.requestId,
        path: context.path,
        method: context.method,
        ipHash: context.ipHash,
      });
      return {
        context,
        response: forbidden("UNTRUSTED_ORIGIN", "Missing trusted origin.", {
          request,
          requestId: context.requestId,
        }),
      };
    }

    if (context.origin && !isTrustedOrigin(context.origin)) {
      securityLog("warn", "untrusted_origin", {
        requestId: context.requestId,
        path: context.path,
        method: context.method,
        origin: context.origin,
        ipHash: context.ipHash,
      });
      return {
        context,
        response: forbidden("UNTRUSTED_ORIGIN", "Origin is not allowed.", {
          request,
          requestId: context.requestId,
        }),
      };
    }
  }

  for (const rateLimit of options.rateLimits ?? []) {
    const response = await enforceRateLimit(request, context, rateLimit);
    if (response) {
      return {
        context,
        response,
      };
    }
  }

  return {
    context,
    response: null,
  };
}
