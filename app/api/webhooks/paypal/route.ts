import { env } from "../../../server/env";
import { getPayPal } from "../../../server/services/paypalClient";
import { confirmPaymentEvent } from "../../../server/services/paymentConfirmation";
import { readJsonBody } from "../../../server/security/body";
import { TimeoutError, withPromiseTimeout } from "../../../server/security/timeout";
import { securityLog } from "../../../server/security/log";
import { applyRouteSecurity } from "../../../server/security/routeSecurity";
import {
  badRequest,
  forbidden,
  gatewayTimeout,
  handleRouteError,
  ok,
  serverError,
} from "../../../server/utils/apiResponse";
import { validateExternalReference } from "../../../server/utils/validation";
import { hasValidWebhookSecret } from "../../../server/utils/webhookAuth";

type PayPalWebhookBody = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
    custom_id?: string;
  };
};

function mapPayPalOrderStatus(status?: string) {
  if (status === "COMPLETED") return "paid" as const;
  if (status === "VOIDED" || status === "CANCELLED" || status === "DENIED") {
    return "failed" as const;
  }
  return "pending" as const;
}

function clean(value: unknown, maxLength = 180) {
  return typeof value === "string"
    ? value.normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength)
    : null;
}

function pickPayerInfo(orderResult: {
  payer?: {
    emailAddress?: string;
    email_address?: string;
    payerId?: string;
    payer_id?: string;
    name?: {
      givenName?: string;
      given_name?: string;
      surname?: string;
    };
  };
}) {
  const payer = orderResult.payer;
  if (!payer) {
    return { payerEmail: null, payerName: null, payerId: null };
  }

  const givenName = clean(payer.name?.givenName ?? payer.name?.given_name, 80);
  const surname = clean(payer.name?.surname, 80);
  const payerName = [givenName, surname].filter(Boolean).join(" ").trim() || null;

  return {
    payerEmail: clean(payer.emailAddress ?? payer.email_address, 180),
    payerName,
    payerId: clean(payer.payerId ?? payer.payer_id, 120),
  };
}

export async function POST(request: Request) {
  const { context, response } = await applyRouteSecurity(request, {
    rateLimits: [
      {
        scope: "paypal.webhook.ip",
        identifier: contextSafeIp(request),
        limit: 120,
        windowMs: 60_000,
        code: "RATE_LIMITED",
        message: "Too many webhook requests.",
      },
    ],
  });
  if (response) return response;

  try {
    if (env.STRICT_ENV_VALIDATION && !env.PAYPAL_WEBHOOK_SECRET) {
      securityLog("error", "paypal_webhook_secret_missing", {
        requestId: context.requestId,
        path: context.path,
      });
      return serverError("PAYPAL_WEBHOOK_NOT_CONFIGURED", "Missing PAYPAL_WEBHOOK_SECRET.", {
        request,
        requestId: context.requestId,
      });
    }

    const isAuthorized = hasValidWebhookSecret({
      expected: env.PAYPAL_WEBHOOK_SECRET,
      headerValue: request.headers.get("x-webhook-secret"),
    });
    if (!isAuthorized) {
      securityLog("warn", "invalid_paypal_webhook_auth", {
        requestId: context.requestId,
        path: context.path,
        ipHash: context.ipHash,
      });
      return forbidden("INVALID_WEBHOOK_SECRET", "Invalid PayPal webhook secret.", {
        request,
        requestId: context.requestId,
      });
    }

    const body = await readJsonBody<PayPalWebhookBody>(request, context, {
      maxBytes: 128 * 1024,
    });
    if (!body.ok) return body.response;

    const eventId = validateExternalReference(body.value.id, "PayPal webhook id");
    if (!eventId.ok) {
      return badRequest("MISSING_EVENT_ID", eventId.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const eventType = body.value.event_type ?? "";
    const supported =
      eventType === "PAYMENT.CAPTURE.COMPLETED" ||
      eventType === "CHECKOUT.ORDER.APPROVED" ||
      eventType === "CHECKOUT.ORDER.COMPLETED";
    if (!supported) {
      return ok({ received: true, ignored: true, reason: "unsupported_event", eventType }, {
        request,
        requestId: context.requestId,
      });
    }

    const captureId = body.value.resource?.id
      ? validateExternalReference(body.value.resource.id, "PayPal capture id")
      : null;
    const paypalOrderId = validateExternalReference(
      body.value.resource?.supplementary_data?.related_ids?.order_id,
      "PayPal order id",
    );
    if (!paypalOrderId.ok) {
      return badRequest("MISSING_PAYPAL_ORDER_ID", paypalOrderId.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const { orders } = getPayPal();
    const orderRes = await withPromiseTimeout(
      orders.getOrder({ id: paypalOrderId.value }),
      10_000,
      "PayPal get order",
    );
    const parsed = orderRes as {
      result?: {
        purchaseUnits?: Array<{ customId?: string }>;
        purchase_units?: Array<{ custom_id?: string }>;
        payer?: {
          emailAddress?: string;
          email_address?: string;
          payerId?: string;
          payer_id?: string;
          name?: {
            givenName?: string;
            given_name?: string;
            surname?: string;
          };
        };
        status?: string;
      };
      body?: {
        purchaseUnits?: Array<{ customId?: string }>;
        purchase_units?: Array<{ custom_id?: string }>;
        payer?: {
          emailAddress?: string;
          email_address?: string;
          payerId?: string;
          payer_id?: string;
          name?: {
            givenName?: string;
            given_name?: string;
            surname?: string;
          };
        };
        status?: string;
      };
    };
    const orderResult = parsed.result ?? parsed.body ?? {};

    const purchaseUnits = Array.isArray(orderResult.purchaseUnits)
      ? orderResult.purchaseUnits
      : Array.isArray(orderResult.purchase_units)
        ? orderResult.purchase_units
        : [];
    const firstPurchaseUnit = purchaseUnits[0] as
      | { customId?: string }
      | { custom_id?: string }
      | undefined;
    const orderIdFromCustom = String(
      (firstPurchaseUnit as { customId?: string } | undefined)?.customId
      ?? (firstPurchaseUnit as { custom_id?: string } | undefined)?.custom_id
      ?? "",
    ).trim() || null;
    const paymentStatus = String(orderResult.status ?? "");
    const payerInfo = pickPayerInfo(orderResult);

    const confirmed = await confirmPaymentEvent({
      provider: "paypal",
      eventId: eventId.value,
      paymentId: captureId?.ok ? captureId.value : paypalOrderId.value,
      status: mapPayPalOrderStatus(paymentStatus),
      orderId: orderIdFromCustom,
      metadata: { eventType, paypalOrderId: paypalOrderId.value, paymentStatus },
      providerStatus: paymentStatus,
      ...payerInfo,
      rawPayload: body.value,
    });

    if (!confirmed.ok) {
      return serverError("ORDER_CONFIRMATION_FAILED", "Could not confirm PayPal payment.", {
        request,
        requestId: context.requestId,
      });
    }

    return ok(
      {
        received: true,
        duplicate: confirmed.duplicate,
        eventType,
        paypalOrderId: paypalOrderId.value,
        captureId: captureId?.ok ? captureId.value : null,
        paymentStatus,
        orderId: confirmed.order?.id ?? orderIdFromCustom,
      },
      {
        request,
        requestId: context.requestId,
      },
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      return gatewayTimeout("PAYPAL_WEBHOOK_TIMEOUT", "PayPal verification timed out.", {
        request,
        requestId: context.requestId,
      });
    }

    return handleRouteError(error, {
      request,
      requestId: context.requestId,
      code: "PAYPAL_WEBHOOK_ERROR",
      publicMessage: "Could not process the PayPal webhook.",
      logEvent: "paypal_webhook_error",
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
