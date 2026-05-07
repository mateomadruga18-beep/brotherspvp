import { OrderStatus, PaymentProvider, Prisma } from "@prisma/client";
import type { CartItem, Order } from "../../lib/storeTypes";
import { prisma } from "../db/prisma";

function toAppOrder(row: {
  id: string;
  username: string;
  gateway: PaymentProvider;
  status: OrderStatus;
  total: Prisma.Decimal;
  items: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): Order {
  return {
    id: row.id,
    username: row.username,
    paymentMethod: row.gateway,
    status: row.status,
    subtotalUsd: Number(row.total),
    totalUsd: Number(row.total),
    items: (row.items as CartItem[]) ?? [],
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

function log(message: string, data: Record<string, unknown>) {
  console.info("[db.orders]", { message, ...data, at: new Date().toISOString() });
}

export async function createOrderRecord(params: {
  id: string;
  username: string;
  gateway: PaymentProvider;
  totalUsd: number;
  items: CartItem[];
}) {
  const row = await prisma.order.create({
    data: {
      id: params.id,
      username: params.username,
      gateway: params.gateway,
      status: OrderStatus.pending,
      total: new Prisma.Decimal(params.totalUsd.toFixed(2)),
      currency: "USD",
      items: params.items as unknown as Prisma.JsonArray,
    },
  });
  log("created", { orderId: row.id, gateway: row.gateway, total: Number(row.total) });
  return toAppOrder(row);
}

export async function getOrderRecord(orderId: string) {
  const row = await prisma.order.findUnique({ where: { id: orderId } });
  if (!row) return null;
  return toAppOrder(row);
}

export async function updateOrderStatusRecord(params: {
  orderId: string;
  status: OrderStatus;
  provider: PaymentProvider;
  paymentId?: string;
  metadata?: Record<string, unknown>;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: params.orderId },
      data: { status: params.status },
    });
    await tx.paymentStatusHistory.create({
      data: {
        orderId: order.id,
        provider: params.provider,
        paymentId: params.paymentId,
        status: params.status,
        metadata: (params.metadata ?? {}) as Prisma.JsonObject,
      },
    });
    return order;
  });
  log("status-updated", { orderId: result.id, status: result.status, provider: params.provider });
  return toAppOrder(result);
}
