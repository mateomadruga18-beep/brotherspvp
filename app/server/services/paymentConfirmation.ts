import { getOrder } from "./orderStore";
import { markOrderFailed, markOrderPaid } from "./orders";
import { getOrderIdForPayment, linkPaymentToOrder, markEventProcessed } from "./paymentStore";
import { enqueueOrderDelivery } from "./deliveryQueue";
import { securityLog } from "../security/log";

type Provider = "paypal" | "mercadopago";
type ConfirmationStatus = "paid" | "failed" | "pending";

function log(level: "info" | "warn" | "error", message: string, data: Record<string, unknown>) {
  const payload = { message, ...data, at: new Date().toISOString() };
  if (level === "error") {
    console.error("[payment-confirmation]", payload);
    return;
  }
  if (level === "warn") {
    console.warn("[payment-confirmation]", payload);
    return;
  }
  console.info("[payment-confirmation]", payload);
}

export async function registerPaymentReference(params: {
  provider: Provider;
  paymentId: string;
  orderId: string;
}) {
  await linkPaymentToOrder(params.provider, params.paymentId, params.orderId);
  log("info", "Registered payment reference", params);
}

export async function confirmPaymentEvent(params: {
  provider: Provider;
  eventId: string;
  paymentId: string;
  status: ConfirmationStatus;
  orderId?: string | null;
  metadata?: Record<string, unknown>;
  rawPayload?: unknown;
}) {
  const markResult = await markEventProcessed({
    provider: params.provider,
    eventId: params.eventId,
    payload: params.rawPayload ?? params,
  });
  if (!markResult.inserted) {
    if ("payloadMismatch" in markResult && markResult.payloadMismatch) {
      securityLog("warn", "webhook_payload_mismatch", {
        provider: params.provider,
        eventId: params.eventId,
        paymentId: params.paymentId,
      });
    }
    log("info", "Skipped duplicate webhook event", params);
    return { ok: true as const, duplicate: true, order: null };
  }

  const resolvedOrderId =
    params.orderId ?? (await getOrderIdForPayment(params.provider, params.paymentId)) ?? null;
  if (!resolvedOrderId) {
    log("warn", "No order mapping for webhook event", params);
    return { ok: true as const, duplicate: false, order: null };
  }

  const existing = await getOrder(resolvedOrderId);
  if (!existing) {
    log("warn", "Order not found while processing webhook", { ...params, resolvedOrderId });
    return { ok: true as const, duplicate: false, order: null };
  }

  if (params.status === "pending") {
    log("info", "Payment still pending", { ...params, resolvedOrderId });
    return { ok: true as const, duplicate: false, order: existing };
  }

  const updated =
    params.status === "paid"
      ? await markOrderPaid({
          orderId: resolvedOrderId,
          provider: params.provider,
          paymentId: params.paymentId,
          metadata: params.metadata,
        })
      : await markOrderFailed({
          orderId: resolvedOrderId,
          provider: params.provider,
          paymentId: params.paymentId,
          metadata: params.metadata,
        });

  if (!updated) {
    log("error", "Failed to update order status", { ...params, resolvedOrderId });
    return { ok: false as const, reason: "ORDER_UPDATE_FAILED" };
  }

  log("info", "Order updated from webhook", {
    ...params,
    resolvedOrderId,
    nextStatus: updated.status,
  });
  if (updated.status === "paid") {
    await enqueueOrderDelivery(updated);
  }
  return { ok: true as const, duplicate: false, order: updated };
}
