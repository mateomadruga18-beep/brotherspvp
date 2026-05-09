import { OrderStatus, PaymentProvider } from "@/generated/prisma/client";
import type { CartItem } from "../../lib/storeTypes";
import { createOrderRecord, getOrderRecord, updateOrderStatusRecord } from "../repositories/ordersRepository";

export async function saveOrder(params: {
  id: string;
  username: string;
  paymentMethod: PaymentProvider;
  totalUsd: number;
  items: CartItem[];
}) {
  return createOrderRecord({
    id: params.id,
    username: params.username,
    gateway: params.paymentMethod,
    totalUsd: params.totalUsd,
    items: params.items,
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
}) {
  return updateOrderStatusRecord(params);
}

