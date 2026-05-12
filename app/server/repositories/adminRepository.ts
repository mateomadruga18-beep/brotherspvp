import { OrderStatus, PaymentProvider, Prisma } from "@/generated/prisma/client";
import { prisma } from "../db/prisma";

const PAGE_SIZE = 50;

export type AdminOrderStatusFilter = "all" | "pending" | "paid" | "failed";
export type AdminPaymentProviderFilter = "all" | "paypal" | "mercadopago";

export type AdminDashboardFilters = {
  status: AdminOrderStatusFilter;
  provider: AdminPaymentProviderFilter;
  query: string;
  page: number;
};

function statusWhere(status: AdminOrderStatusFilter) {
  if (status === "all") return undefined;
  return status as OrderStatus;
}

function providerWhere(provider: AdminPaymentProviderFilter) {
  if (provider === "all") return undefined;
  return provider as PaymentProvider;
}

function buildWhere(filters: AdminDashboardFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  const status = statusWhere(filters.status);
  const provider = providerWhere(filters.provider);

  if (status) where.status = status;
  if (provider) where.gateway = provider;

  if (filters.query) {
    where.OR = [
      { id: { contains: filters.query, mode: "insensitive" } },
      { username: { contains: filters.query, mode: "insensitive" } },
      { payerEmail: { contains: filters.query, mode: "insensitive" } },
      { payerName: { contains: filters.query, mode: "insensitive" } },
      { payerId: { contains: filters.query, mode: "insensitive" } },
      { clientIp: { contains: filters.query, mode: "insensitive" } },
      {
        paymentReferences: {
          some: {
            providerPaymentId: { contains: filters.query, mode: "insensitive" },
          },
        },
      },
    ];
  }

  return where;
}

export async function getAdminDashboard(filters: AdminDashboardFilters) {
  const where = buildWhere(filters);
  const skip = (filters.page - 1) * PAGE_SIZE;

  const [
    orders,
    filteredCount,
    totalCount,
    pendingCount,
    paidCount,
    failedCount,
    paidTotal,
    providerTotals,
    deliveryCounts,
  ] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        paymentReferences: {
          orderBy: { createdAt: "desc" },
        },
        paymentStatusHistory: {
          orderBy: { createdAt: "desc" },
        },
        deliveryTasks: {
          orderBy: { createdAt: "asc" },
          include: {
            logs: {
              orderBy: { createdAt: "desc" },
              take: 6,
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.count(),
    prisma.order.count({ where: { status: OrderStatus.pending } }),
    prisma.order.count({ where: { status: OrderStatus.paid } }),
    prisma.order.count({ where: { status: OrderStatus.failed } }),
    prisma.order.aggregate({
      where: { status: OrderStatus.paid },
      _sum: { total: true },
    }),
    prisma.order.groupBy({
      by: ["gateway"],
      where: { status: OrderStatus.paid },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.deliveryTask.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return {
    orders,
    pagination: {
      page: filters.page,
      pageSize: PAGE_SIZE,
      filteredCount,
      totalPages: Math.max(1, Math.ceil(filteredCount / PAGE_SIZE)),
    },
    summary: {
      totalCount,
      pendingCount,
      paidCount,
      failedCount,
      paidTotalUsd: Number(paidTotal._sum.total ?? 0),
      providerTotals: providerTotals.map((row) => ({
        provider: row.gateway,
        count: row._count._all,
        totalUsd: Number(row._sum.total ?? 0),
      })),
      deliveryCounts: deliveryCounts.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
    },
  };
}
