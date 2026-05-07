import { env } from "../../../server/env";
import { confirmPaymentEvent } from "../../../server/services/paymentConfirmation";
import { readJsonBody } from "../../../server/security/body";
import { fetchWithTimeout, TimeoutError } from "../../../server/security/timeout";
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
import { hasValidMercadoPagoSignature, hasValidWebhookSecret } from "../../../server/utils/webhookAuth";

type MercadoPagoWebhookBody = {
  action?: string;
  type?: string;
  data?: { id?: string | number };
};

type MercadoPagoPaymentResponse = {
  id?: number;
  status?: string;
  external_reference?: string;
};

function mapMpStatus(status?: string) {
  if (status === "approved") return "paid" as const;
  if (status === "rejected" || status === "cancelled" || status === "charged_back") {
    return "failed" as const;
  }
  return "pending" as const;
}

export async function POST(request: Request) {
  const { context, response } = await applyRouteSecurity(request, {
    rateLimits: [
      {
        scope: "mercadopago.webhook.ip",
        identifier: contextSafeIp(request),
        limit: 180,
        windowMs: 60_000,
        code: "RATE_LIMITED",
        message: "Too many webhook requests.",
      },
    ],
  });
  if (response) return response;

  try {
    const requestUrl = new URL(request.url);
    const hasSignatureHeader = Boolean(request.headers.get("x-signature"));
    const isAuthorized = hasSignatureHeader
      ? hasValidMercadoPagoSignature({
          secret: env.MERCADOPAGO_WEBHOOK_SECRET,
          signatureHeader: request.headers.get("x-signature"),
          requestId: request.headers.get("x-request-id"),
          requestUrl,
        })
      : hasValidWebhookSecret({
          expected: env.MERCADOPAGO_WEBHOOK_SECRET,
          headerValue: request.headers.get("x-webhook-secret"),
          queryValue: requestUrl.searchParams.get("token"),
        });

    if (!isAuthorized) {
      securityLog("warn", "invalid_mercadopago_webhook_auth", {
        requestId: context.requestId,
        path: context.path,
        ipHash: context.ipHash,
      });
      return forbidden("INVALID_WEBHOOK_SECRET", "Invalid Mercado Pago webhook signature.", {
        request,
        requestId: context.requestId,
      });
    }

    const body = await readJsonBody<MercadoPagoWebhookBody>(request, context, {
      maxBytes: 64 * 1024,
    });
    if (!body.ok) return body.response;

    const eventType = body.value.type ?? body.value.action ?? "";
    if (eventType !== "payment" && eventType !== "payment.created") {
      return ok({ received: true, ignored: true, reason: "unsupported_event", eventType }, {
        request,
        requestId: context.requestId,
      });
    }

    const paymentId = validateExternalReference(String(body.value.data?.id ?? ""), "payment id");
    if (!paymentId.ok) {
      return badRequest("MISSING_PAYMENT_ID", paymentId.reason, {
        request,
        requestId: context.requestId,
      });
    }

    if (!env.MERCADOPAGO_ACCESS_TOKEN) {
      return serverError("MERCADOPAGO_NOT_CONFIGURED", "Missing MERCADOPAGO_ACCESS_TOKEN.", {
        request,
        requestId: context.requestId,
      });
    }

    const verifyRes = await fetchWithTimeout(
      `https://api.mercadopago.com/v1/payments/${paymentId.value}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` },
      },
      10_000,
    );
    if (!verifyRes.ok) {
      const verifyErr = await verifyRes.text();
      return serverError("MERCADOPAGO_VERIFY_FAILED", verifyErr || "Could not verify payment.", {
        request,
        requestId: context.requestId,
      });
    }

    const payment = (await verifyRes.json()) as MercadoPagoPaymentResponse;
    const confirmed = await confirmPaymentEvent({
      provider: "mercadopago",
      eventId: `payment:${paymentId.value}`,
      paymentId: paymentId.value,
      status: mapMpStatus(payment.status),
      orderId: payment.external_reference ?? null,
      metadata: { paymentStatus: payment.status },
      rawPayload: body.value,
    });

    if (!confirmed.ok) {
      return serverError("ORDER_CONFIRMATION_FAILED", "Could not confirm Mercado Pago payment.", {
        request,
        requestId: context.requestId,
      });
    }

    return ok(
      {
        received: true,
        duplicate: confirmed.duplicate,
        paymentId: paymentId.value,
        status: payment.status ?? "unknown",
        orderId: confirmed.order?.id ?? payment.external_reference ?? null,
      },
      {
        request,
        requestId: context.requestId,
      },
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      return gatewayTimeout(
        "MERCADOPAGO_WEBHOOK_TIMEOUT",
        "Mercado Pago verification timed out.",
        { request, requestId: context.requestId },
      );
    }

    return handleRouteError(error, {
      request,
      requestId: context.requestId,
      code: "MERCADOPAGO_WEBHOOK_ERROR",
      publicMessage: "Could not process the Mercado Pago webhook.",
      logEvent: "mercadopago_webhook_error",
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
