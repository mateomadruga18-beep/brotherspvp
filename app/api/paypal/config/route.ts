import { env } from "../../../server/env";
import { hashIdentifier } from "../../../server/security/request";
import { applyRouteSecurity } from "../../../server/security/routeSecurity";
import { ok, serverError } from "../../../server/utils/apiResponse";
import { handleRouteError } from "../../../server/utils/apiResponse";

export async function GET(request: Request) {
  const { context, response } = await applyRouteSecurity(request, {
    requireTrustedOrigin: true,
    allowMissingOrigin: true,
    rateLimits: [
      {
        scope: "paypal.config.ip",
        identifier: hashIdentifier(contextSafeIp(request)),
        limit: 120,
        windowMs: 60_000,
        code: "RATE_LIMITED",
        message: "Too many PayPal config requests. Try again shortly.",
      },
    ],
  });
  if (response) return response;

  try {
    if (!env.PAYPAL_CLIENT_ID) {
      return serverError(
        "PAYPAL_NOT_CONFIGURED",
        "Missing PAYPAL_CLIENT_ID. Create a .env.local file from .env.local.example.",
        { request, requestId: context.requestId },
      );
    }

    return ok(
      {
        clientId: env.PAYPAL_CLIENT_ID,
        environment: env.PAYPAL_ENVIRONMENT,
      },
      { request, requestId: context.requestId },
    );
  } catch (error) {
    return handleRouteError(error, {
      request,
      requestId: context.requestId,
      code: "PAYPAL_CONFIG_ERROR",
      publicMessage: "Could not load PayPal configuration.",
      logEvent: "paypal_config_error",
    });
  }
}

function contextSafeIp(request: Request) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-vercel-forwarded-for")
    ?? request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}
