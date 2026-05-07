import { getOrder } from "../../../server/services/orderStore";
import { applyRouteSecurity } from "../../../server/security/routeSecurity";
import { handleRouteError, notFound, ok, badRequest } from "../../../server/utils/apiResponse";
import { validateInternalOrderId } from "../../../server/utils/validation";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { context, response } = await applyRouteSecurity(request, {
    requireTrustedOrigin: true,
    allowMissingOrigin: true,
    rateLimits: [
      {
        scope: "orders.get.ip",
        identifier: contextSafeIp(request),
        limit: 60,
        windowMs: 60_000,
        code: "RATE_LIMITED",
        message: "Too many order lookup requests. Try again shortly.",
      },
    ],
  });
  if (response) return response;

  try {
    const { id } = await ctx.params;
    const orderId = validateInternalOrderId(id);
    if (!orderId.ok) {
      return badRequest("INVALID_ORDER_ID", orderId.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const order = await getOrder(orderId.value);
    if (!order) {
      return notFound("ORDER_NOT_FOUND", "Order not found.", {
        request,
        requestId: context.requestId,
      });
    }

    return ok({ order }, { request, requestId: context.requestId });
  } catch (error) {
    return handleRouteError(error, {
      request,
      requestId: context.requestId,
      code: "ORDER_LOOKUP_ERROR",
      publicMessage: "Could not load the order.",
      logEvent: "order_lookup_error",
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
