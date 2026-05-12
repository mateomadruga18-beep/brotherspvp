import { OrderStatus, PaymentProvider } from "@/generated/prisma/client";
import type { CartItem } from "../../lib/storeTypes";
import { createOrderRecord, getOrderRecord, updateOrderStatusRecord } from "../repositories/ordersRepository";

export async function saveOrder(params: {
  id: string;
  username: string;
  paymentMethod: PaymentProvider;
  totalUsd: number;
  items: CartItem[];
  clientIp?: string | null;
  clientIpHash?: string | null;
  userAgent?: string | null;
  checkoutRequestId?: string | null;
}) {
  return createOrderRecord({
    id: params.id,
    username: params.username,
    gateway: params.paymentMethod,
    totalUsd: params.totalUsd,
    items: params.items,
    clientIp: params.clientIp,
    clientIpHash: params.clientIpHash,
    userAgent: params.userAgent,
    checkoutRequestId: params.checkoutRequestId,
  });
}

export async function getOrder(orderId: string) {
  return getOrderRecord(orderId);
}

export async function updateOrderStatus(params: {
  orderId: string;
  status: OrderStatus;
  provider: PaymentProvider;
  paymentId?: string;
  metadata?: Record<string, unknown>;
  payerEmail?: string | null;
  payerName?: string | null;
  payerId?: string | null;
  providerStatus?: string | null;
}) {
  return updateOrderStatusRecord(params);
}

