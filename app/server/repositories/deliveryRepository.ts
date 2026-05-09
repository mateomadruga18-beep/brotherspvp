import { DeliveryTaskStatus } from "@/generated/prisma/client";
import { prisma } from "../db/prisma";

export type DeliveryTaskRecord = {
  id: string;
  orderId: string;
  username: string;
  command: string;
  status: "pending" | "delivered" | "failed";
  retryCount: number;
  lastError: string | null;
  nextAttemptAt: number;
  createdAt: number;
  updatedAt: number;
};

function toRecord(row: {
  id: string;
  orderId: string;
  username: string;
  command: string;
  status: DeliveryTaskStatus;
  retryCount: number;
  lastError: string | null;
  nextAttemptAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): DeliveryTaskRecord {
  return {
    id: row.id,
    orderId: row.orderId,
    username: row.username,
    command: row.command,
    status: row.status,
    retryCount: row.retryCount,
    lastError: row.lastError,
    nextAttemptAt: row.nextAttemptAt.getTime(),
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

function log(message: string, data: Record<string, unknown>) {
  console.info("[db.delivery]", { message, ...data, at: new Date().toISOString() });
}

export async function upsertDeliveryTask(params: {
  id: string;
  orderId: string;
  username: string;
  command: string;
}) {
  const existing = await prisma.deliveryTask.findUnique({ where: { id: params.id } });
  if (!existing) {
    const created = await prisma.deliveryTask.create({
      data: {
        id: params.id,
        orderId: params.orderId,
        username: params.username,
        command: params.command,
        status: DeliveryTaskStatus.pending,
        retryCount: 0,
        nextAttemptAt: new Date(),
      },
    });
    log("task-upserted", { taskId: created.id, status: created.status });
    return toRecord(created);
  }

  if (existing.status === DeliveryTaskStatus.failed) {
    const reset = await prisma.deliveryTask.update({
      where: { id: params.id },
      data: {
        status: DeliveryTaskStatus.pending,
        retryCount: 0,
        lastError: null,
        nextAttemptAt: new Date(),
      },
    });
    log("task-reset", { taskId: reset.id, status: reset.status });
    return toRecord(reset);
  }

  const row = existing;
  log("task-upserted", { taskId: row.id, status: row.status });
  return toRecord(row);
}

export async function getDuePendingTasks(limit = 50) {
  const rows = await prisma.deliveryTask.findMany({
    where: {
      status: DeliveryTaskStatus.pending,
      nextAttemptAt: { lte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return rows.map(toRecord);
}

export async function getNextPendingTask() {
  const row = await prisma.deliveryTask.findFirst({
    where: { status: DeliveryTaskStatus.pending },
    orderBy: { nextAttemptAt: "asc" },
  });
  return row ? toRecord(row) : null;
}

export async function markTaskDelivered(params: { taskId: string; message: string }) {
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.deliveryTask.update({
      where: { id: params.taskId },
      data: {
        status: DeliveryTaskStatus.delivered,
        lastError: null,
      },
    });
    await tx.deliveryLog.create({
      data: { taskId: params.taskId, message: params.message },
    });
    return updated;
  });
  log("task-delivered", { taskId: row.id });
  return toRecord(row);
}

export async function markTaskFailedForRetry(params: {
  taskId: string;
  retryCount: number;
  nextAttemptAt: Date;
  error: string;
}) {
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.deliveryTask.update({
      where: { id: params.taskId },
      data: {
        status: DeliveryTaskStatus.pending,
        retryCount: params.retryCount,
        lastError: params.error,
        nextAttemptAt: params.nextAttemptAt,
      },
    });
    await tx.deliveryLog.create({
      data: { taskId: params.taskId, message: `retry_scheduled:${params.error}` },
    });
    return updated;
  });
  log("task-retry", { taskId: row.id, retryCount: row.retryCount });
  return toRecord(row);
}

export async function markTaskFailedFinal(params: {
  taskId: string;
  retryCount: number;
  error: string;
}) {
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.deliveryTask.update({
      where: { id: params.taskId },
      data: {
        status: DeliveryTaskStatus.failed,
        retryCount: params.retryCount,
        lastError: params.error,
      },
    });
    await tx.deliveryLog.create({
      data: { taskId: params.taskId, message: `final_failure:${params.error}` },
    });
    return updated;
  });
  log("task-failed", { taskId: row.id, retryCount: row.retryCount });
  return toRecord(row);
}

export async function getTasksForOrder(orderId: string) {
  const rows = await prisma.deliveryTask.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toRecord);
}
