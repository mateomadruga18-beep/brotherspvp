import { getPayPal } from "../../../server/services/paypalClient";
import { getOrder } from "../../../server/services/orderStore";
import { registerPaymentReference } from "../../../server/services/paymentConfirmation";
import { readJsonBody } from "../../../server/security/body";
import { enforceRateLimit } from "../../../server/security/rateLimit";
import { applyRouteSecurity } from "../../../server/security/routeSecurity";
import { TimeoutError, withPromiseTimeout } from "../../../server/security/timeout";
import {
  badRequest,
  gatewayTimeout,
  handleRouteError,
  notFound,
  ok,
} from "../../../server/utils/apiResponse";
import { validateExternalReference, validateInternalOrderId } from "../../../server/utils/validation";

type CaptureBody = {
  paypalOrderId?: string;
  orderId?: string;
};

export async function POST(request: Request) {
  const { context, response } = await applyRouteSecurity(request, {
    requireTrustedOrigin: true,
    rateLimits: [
      {
        scope: "paypal.capture-order.ip",
        identifier: contextSafeIp(request),
        limit: 12,
        windowMs: 60_000,
        code: "RATE_LIMITED",
        message: "Too many capture attempts. Try again shortly.",
      },
    ],
  });
  if (response) return response;

  try {
    const body = await readJsonBody<CaptureBody>(request, context, {
      maxBytes: 8 * 1024,
    });
    if (!body.ok) return body.response;

    const paypalOrderId = validateExternalReference(body.value.paypalOrderId, "paypal order id");
    if (!paypalOrderId.ok) {
      return badRequest("MISSING_PAYPAL_ORDER_ID", paypalOrderId.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const orderId = validateInternalOrderId(body.value.orderId);
    if (!orderId.ok) {
      return badRequest("MISSING_ORDER_ID", orderId.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const duplicateCaptureResponse = await enforceRateLimit(request, context, {
      scope: "paypal.capture-order.duplicate",
      identifier: `${context.ipHash}:${orderId.value}:${paypalOrderId.value}`,
      limit: 1,
      windowMs: 15_000,
      code: "DUPLICATE_CAPTURE",
      message: "Duplicate capture attempt detected. Wait a few seconds before retrying.",
    });
    if (duplicateCaptureResponse) return duplicateCaptureResponse;

    const existing = await getOrder(orderId.value);
    if (!existing) {
      return notFound("ORDER_NOT_FOUND", "Order not found.", {
        request,
        requestId: context.requestId,
      });
    }

    const { orders } = getPayPal();
    const res = await withPromiseTimeout(
      orders.captureOrder({
        id: paypalOrderId.value,
        paypalRequestId: `capture:${orderId.value}`,
      }),
      10_000,
      "PayPal capture order",
    );

    const parsed = res as {
      result?: { status?: string };
      body?: { status?: string };
      status?: string;
    };
    const status = parsed.result?.status ?? parsed.body?.status ?? parsed.status ?? null;

    if (status !== "COMPLETED") {
      return badRequest("PAYPAL_NOT_COMPLETED", `PayPal status: ${status ?? "unknown"}`, {
        request,
        requestId: context.requestId,
      });
    }

    await registerPaymentReference({
      provider: "paypal",
      paymentId: paypalOrderId.value,
      orderId: orderId.value,
    });

    return ok({ status: "captured", orderId: orderId.value, paypalOrderId: paypalOrderId.value }, {
      request,
      requestId: context.requestId,
    });
  } catch (error) {
    if (error instanceof TimeoutError) {
      return gatewayTimeout("PAYPAL_CAPTURE_TIMEOUT", "PayPal took too long to respond.", {
        request,
        requestId: context.requestId,
      });
    }

    return handleRouteError(error, {
      request,
      requestId: context.requestId,
      code: "PAYPAL_CAPTURE_ERROR",
      publicMessage: "Could not capture the PayPal order.",
      logEvent: "paypal_capture_order_error",
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
