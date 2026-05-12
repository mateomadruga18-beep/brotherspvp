import { OrderStatus, PaymentProvider, Prisma } from "@/generated/prisma/client";
import type { CartItem, Order } from "../../lib/storeTypes";
import { prisma } from "../db/prisma";

function toAppOrder(row: {
  id: string;
  username: string;
  gateway: PaymentProvider;
  status: OrderStatus;
  total: Prisma.Decimal;
  items: Prisma.JsonValue;
  payerEmail: string | null;
  payerName: string | null;
  payerId: string | null;
  providerStatus: string | null;
  clientIp: string | null;
  clientIpHash: string | null;
  userAgent: string | null;
  checkoutRequestId: string | null;
  paidAt: Date | null;
  failedAt: Date | null;
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
    payerEmail: row.payerEmail,
    payerName: row.payerName,
    payerId: row.payerId,
    providerStatus: row.providerStatus,
    clientIp: row.clientIp,
    clientIpHash: row.clientIpHash,
    userAgent: row.userAgent,
    checkoutRequestId: row.checkoutRequestId,
    paidAt: row.paidAt?.getTime() ?? null,
    failedAt: row.failedAt?.getTime() ?? null,
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
  clientIp?: string | null;
  clientIpHash?: string | null;
  userAgent?: string | null;
  checkoutRequestId?: string | null;
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
      clientIp: params.clientIp,
      clientIpHash: params.clientIpHash,
      userAgent: params.userAgent,
      checkoutRequestId: params.checkoutRequestId,
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
  payerEmail?: string | null;
  payerName?: string | null;
  payerId?: string | null;
  providerStatus?: string | null;
}) {
  const statusTimestamp =
    params.status === OrderStatus.paid
      ? { paidAt: new Date(), failedAt: null }
      : params.status === OrderStatus.failed
        ? { failedAt: new Date() }
        : {};

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: params.orderId },
      data: {
        status: params.status,
        payerEmail: params.payerEmail,
        payerName: params.payerName,
        payerId: params.payerId,
        providerStatus: params.providerStatus,
        ...statusTimestamp,
      },
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

export type BuyerStat = {
  username: string;
  totalUsd: number;
  orderCount: number;
  lastPurchaseAt: number;
};

export async function getPaidBuyerStats(recentLimit = 21): Promise<{
  recentBuyers: BuyerStat[];
  topBuyer: BuyerStat | null;
}> {
  const [recentRows, topRows] = await Promise.all([
    prisma.order.findMany({
      where: { status: OrderStatus.paid },
      orderBy: { updatedAt: "desc" },
      select: {
        username: true,
        total: true,
        updatedAt: true,
      },
      take: Math.max(recentLimit * 4, recentLimit),
    }),
    prisma.order.groupBy({
      by: ["username"],
      where: { status: OrderStatus.paid },
      _sum: { total: true },
      _count: { _all: true },
      _max: { updatedAt: true },
      orderBy: { _sum: { total: "desc" } },
      take: 1,
    }),
  ]);

  const seen = new Set<string>();
  const recentBuyers: BuyerStat[] = [];

  for (const row of recentRows) {
    const key = row.username.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    recentBuyers.push({
      username: row.username,
      totalUsd: Number(row.total),
      orderCount: 1,
      lastPurchaseAt: row.updatedAt.getTime(),
    });

    if (recentBuyers.length >= recentLimit) break;
  }

  const topRow = topRows[0];

  return {
    recentBuyers,
    topBuyer: topRow
      ? {
          username: topRow.username,
          totalUsd: Number(topRow._sum.total ?? 0),
          orderCount: topRow._count._all,
          lastPurchaseAt: topRow._max.updatedAt?.getTime() ?? 0,
        }
      : null,
  };
}
