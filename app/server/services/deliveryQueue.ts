import type { Order } from "../../lib/storeTypes";
import { getProductById } from "../../lib/catalog";
import { validateMinecraftUsername } from "../utils/validation";
import { sendRconCommand } from "./rconClient";
import {
  getDuePendingTasks,
  getNextPendingTask,
  getTasksForOrder,
  markTaskDelivered,
  markTaskFailedFinal,
  markTaskFailedForRetry,
  upsertDeliveryTask,
  type DeliveryTaskRecord,
} from "../repositories/deliveryRepository";

let running = false;
let retryTimer: NodeJS.Timeout | null = null;
let bootstrapped = false;

const MAX_ATTEMPTS = 5;
const BASE_RETRY_MS = 5000;
const ALLOWED_RANKS = {
  VIP: "vip",
  "VIP+": "vipplus",
  BROTHERS: "brothers",
  "BROTHERS+": "brothersplus",
} as const;

function now() {
  return Date.now();
}

function log(level: "info" | "warn" | "error", message: string, data: Record<string, unknown>) {
  const payload = { message, ...data, at: new Date().toISOString() };
  if (level === "error") return console.error("[delivery]", payload);
  if (level === "warn") return console.warn("[delivery]", payload);
  return console.info("[delivery]", payload);
}

function buildRankCommand(productName: string, username: string) {
  const normalized = productName.toUpperCase();
  const rank = ALLOWED_RANKS[normalized as keyof typeof ALLOWED_RANKS];
  if (!rank) return null;
  return `lp user ${username} parent add ${rank}`;
}

function validateLuckPermsCommand(command: string) {
  const trimmed = command.trim();
  const match = /^lp user ([A-Za-z0-9_]{3,16}) parent add (vip|vipplus|brothers|brothersplus)$/i.exec(
    trimmed,
  );
  if (!match) {
    return { ok: false as const, reason: "Invalid LuckPerms command." };
  }

  const username = validateMinecraftUsername(match[1]);
  if (!username.ok) {
    return { ok: false as const, reason: username.reason };
  }

  return { ok: true as const, value: trimmed };
}

function delayForAttempt(attempt: number) {
  const exponent = Math.max(0, attempt - 1);
  return BASE_RETRY_MS * 2 ** exponent;
}

function scheduleRetryWorker() {
  if (retryTimer) clearTimeout(retryTimer);
  void (async () => {
    const next = await getNextPendingTask();
    if (!next) return;
    const waitMs = Math.max(0, next.nextAttemptAt - now());
    retryTimer = setTimeout(() => {
      void processQueue();
    }, waitMs);
  })();
}

async function processTask(task: DeliveryTaskRecord) {
  const nextAttempt = task.retryCount + 1;
  log("info", "Delivering task", {
    taskId: task.id,
    orderId: task.orderId,
    attempts: nextAttempt,
    command: task.command,
  });

  try {
    const command = validateLuckPermsCommand(task.command);
    if (!command.ok) {
      throw new Error(command.reason);
    }

    const response = await sendRconCommand(command.value);
    await markTaskDelivered({
      taskId: task.id,
      message: `delivery_success:${response || "ok"}`,
    });
    log("info", "Delivery succeeded", {
      taskId: task.id,
      orderId: task.orderId,
      attempts: nextAttempt,
      response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown delivery error";

    if (nextAttempt >= MAX_ATTEMPTS) {
      await markTaskFailedFinal({
        taskId: task.id,
        retryCount: nextAttempt,
        error: message,
      });
      log("error", "Delivery permanently failed", {
        taskId: task.id,
        orderId: task.orderId,
        attempts: nextAttempt,
        error: message,
      });
      return;
    }

    const nextAttemptAt = new Date(now() + delayForAttempt(nextAttempt));
    await markTaskFailedForRetry({
      taskId: task.id,
      retryCount: nextAttempt,
      nextAttemptAt,
      error: message,
    });
    log("warn", "Delivery failed, scheduled retry", {
      taskId: task.id,
      orderId: task.orderId,
      attempts: nextAttempt,
      nextAttemptAt: nextAttemptAt.toISOString(),
      error: message,
    });
  }
}

export async function processQueue() {
  if (running) return;
  running = true;
  try {
    const dueTasks = await getDuePendingTasks();

    for (const task of dueTasks) {
      await processTask(task);
    }
  } finally {
    running = false;
    scheduleRetryWorker();
  }
}

export async function enqueueOrderDelivery(order: Order) {
  ensureQueueBootstrapped();
  const username = validateMinecraftUsername(order.username);
  if (!username.ok) {
    log("error", "Order has invalid username, delivery skipped", {
      orderId: order.id,
      username: order.username,
      reason: username.reason,
    });
    return;
  }

  const uniqueCommands = new Set<string>();
  for (const line of order.items) {
    const product = getProductById(line.productId);
    if (!product) {
      log("warn", "Unknown product in order, skipping delivery", {
        orderId: order.id,
        productId: line.productId,
      });
      continue;
    }

    const command = buildRankCommand(product.name, username.value);
    if (!command) continue;
    uniqueCommands.add(command);
  }

  for (const command of uniqueCommands) {
    const taskId = `${order.id}:${command}`;
    const existing = await upsertDeliveryTask({
      id: taskId,
      orderId: order.id,
      username: username.value,
      command,
    });
    if (existing.status === "delivered") {
      log("info", "Skipped duplicate delivery enqueue", {
        orderId: order.id,
        taskId,
        status: existing.status,
      });
      continue;
    }
    log("info", "Enqueued delivery task", { orderId: order.id, taskId, command });
  }

  void processQueue();
}

export async function getOrderDeliveryTasks(orderId: string) {
  return getTasksForOrder(orderId);
}

export function ensureQueueBootstrapped() {
  if (bootstrapped) return;
  bootstrapped = true;
  log("info", "Starting delivery queue recovery", {});
  void processQueue();
}

if (process.env.NEXT_PHASE !== "phase-production-build") {
  ensureQueueBootstrapped();
}
