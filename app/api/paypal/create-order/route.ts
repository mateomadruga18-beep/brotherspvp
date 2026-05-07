import { CheckoutPaymentIntent } from "@paypal/paypal-server-sdk";
import type { CartItem } from "../../../lib/storeTypes";
import { getPayPal } from "../../../server/services/paypalClient";
import { registerPaymentReference } from "../../../server/services/paymentConfirmation";
import { createOrder } from "../../../server/services/orders";
import { readJsonBody } from "../../../server/security/body";
import { hashIdentifier } from "../../../server/security/request";
import { enforceRateLimit } from "../../../server/security/rateLimit";
import { applyRouteSecurity } from "../../../server/security/routeSecurity";
import { TimeoutError, withPromiseTimeout } from "../../../server/security/timeout";
import {
  badRequest,
  gatewayTimeout,
  handleRouteError,
  ok,
  serverError,
} from "../../../server/utils/apiResponse";
import { validateCartItems, validateMinecraftUsername } from "../../../server/utils/validation";

type CreatePayPalOrderBody = {
  username?: string;
  items?: CartItem[];
};

export async function POST(request: Request) {
  const { context, response } = await applyRouteSecurity(request, {
    requireTrustedOrigin: true,
    rateLimits: [
      {
        scope: "paypal.create-order.ip",
        identifier: contextSafeIp(request),
        limit: 10,
        windowMs: 60_000,
        code: "RATE_LIMITED",
        message: "Too many checkout attempts. Try again shortly.",
      },
    ],
  });
  if (response) return response;

  try {
    const body = await readJsonBody<CreatePayPalOrderBody>(request, context, {
      maxBytes: 12 * 1024,
    });
    if (!body.ok) return body.response;

    const user = validateMinecraftUsername(body.value.username);
    if (!user.ok) {
      return badRequest("INVALID_USERNAME", user.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const items = validateCartItems(body.value.items);
    if (!items.ok) {
      return badRequest("INVALID_CART", items.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const cartFingerprint = hashIdentifier(
      JSON.stringify({
        provider: "paypal",
        username: user.value,
        items: items.value,
      }),
    );

    const duplicateCheckoutResponse = await enforceRateLimit(request, context, {
      scope: "checkout.duplicate",
      identifier: `${context.ipHash}:${cartFingerprint}`,
      limit: 1,
      windowMs: 20_000,
      code: "DUPLICATE_CHECKOUT",
      message: "Duplicate checkout attempt detected. Wait a few seconds before retrying.",
    });
    if (duplicateCheckoutResponse) return duplicateCheckoutResponse;

    const paymentCooldownResponse = await enforceRateLimit(request, context, {
      scope: "checkout.cooldown",
      identifier: `${context.ipHash}:paypal:${user.value}`,
      limit: 3,
      windowMs: 120_000,
      code: "PAYMENT_COOLDOWN",
      message: "Too many payment attempts for this account. Try again shortly.",
    });
    if (paymentCooldownResponse) return paymentCooldownResponse;

    const created = await createOrder({
      username: user.value,
      items: items.value,
      paymentMethod: "paypal",
    });
    if (!created.ok) {
      return badRequest("INVALID_ITEMS", created.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const { orders } = getPayPal();
    const value = created.order.totalUsd.toFixed(2);
    const res = await withPromiseTimeout(
      orders.createOrder({
        paypalRequestId: created.order.id,
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              customId: created.order.id,
              description: `BrotherSPvP Store Order ${created.order.id}`,
              amount: {
                currencyCode: "USD",
                value,
              },
            },
          ],
        },
      }),
      10_000,
      "PayPal create order",
    );

    const parsed = res as {
      result?: { id?: string };
      body?: { id?: string };
      id?: string;
    };
    const paypalOrderId = parsed.result?.id ?? parsed.body?.id ?? parsed.id ?? null;
    if (!paypalOrderId) {
      return serverError("PAYPAL_CREATE_FAILED", "Could not create PayPal order.", {
        request,
        requestId: context.requestId,
      });
    }

    await registerPaymentReference({
      provider: "paypal",
      paymentId: String(paypalOrderId),
      orderId: created.order.id,
    });

    return ok({ orderId: created.order.id, paypalOrderId }, {
      request,
      requestId: context.requestId,
    });
  } catch (error) {
    if (error instanceof TimeoutError) {
      return gatewayTimeout("PAYPAL_CREATE_TIMEOUT", "PayPal took too long to respond.", {
        request,
        requestId: context.requestId,
      });
    }

    return handleRouteError(error, {
      request,
      requestId: context.requestId,
      code: "PAYPAL_CREATE_ERROR",
      publicMessage: "Could not create a PayPal order.",
      logEvent: "paypal_create_order_error",
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
