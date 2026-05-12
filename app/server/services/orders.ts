import type { CartItem, Order, PaymentMethod } from "../../lib/storeTypes";
import { randomUUID } from "node:crypto";
import { computeTotalsUsd } from "./catalogPricing";
import { saveOrder, updateOrderStatus } from "./orderStore";

function createOrderId() {
  const a = randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  const b = randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `BSPVP-${a}-${b}`;
}

export async function createOrder(params: {
  username: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  evidence?: {
    clientIp?: string | null;
    clientIpHash?: string | null;
    userAgent?: string | null;
    checkoutRequestId?: string | null;
  };
}) {
  const totals = computeTotalsUsd(params.items);
  if (!totals.ok) return totals;

  const now = Date.now();
  const orderId = createOrderId();
  const order: Order = {
    id: orderId,
    username: params.username,
    items: params.items,
    paymentMethod: params.paymentMethod,
    status: "pending",
    subtotalUsd: totals.subtotalUsd,
    totalUsd: totals.totalUsd,
    createdAt: now,
    updatedAt: now,
  };

  await saveOrder({
    id: orderId,
    username: params.username,
    paymentMethod: params.paymentMethod,
    totalUsd: totals.totalUsd,
    items: params.items,
    clientIp: params.evidence?.clientIp,
    clientIpHash: params.evidence?.clientIpHash,
    userAgent: params.evidence?.userAgent,
    checkoutRequestId: params.evidence?.checkoutRequestId,
  });
  return { ok: true as const, order };
}

export async function markOrderPaid(params: {
  orderId: string;
  provider: "paypal" | "mercadopago";
  paymentId?: string;
  metadata?: Record<string, unknown>;
  payerEmail?: string | null;
  payerName?: string | null;
  payerId?: string | null;
  providerStatus?: string | null;
}) {
  return updateOrderStatus({
    orderId: params.orderId,
    status: "paid",
    provider: params.provider,
    paymentId: params.paymentId,
    metadata: params.metadata,
    payerEmail: params.payerEmail,
    payerName: params.payerName,
    payerId: params.payerId,
    providerStatus: params.providerStatus,
  });
}

export async function markOrderFailed(params: {
  orderId: string;
  provider: "paypal" | "mercadopago";
  paymentId?: string;
  metadata?: Record<string, unknown>;
  payerEmail?: string | null;
  payerName?: string | null;
  payerId?: string | null;
  providerStatus?: string | null;
}) {
  return updateOrderStatus({
    orderId: params.orderId,
    status: "failed",
    provider: params.provider,
    paymentId: params.paymentId,
    metadata: params.metadata,
    payerEmail: params.payerEmail,
    payerName: params.payerName,
    payerId: params.payerId,
    providerStatus: params.providerStatus,
  });
}

