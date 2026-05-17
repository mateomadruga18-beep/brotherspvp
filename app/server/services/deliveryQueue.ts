import type { Order } from "../../lib/storeTypes";
import { getProductById } from "../../lib/catalog";
import { env } from "../env";
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
const INVERTED_EXCLAMATION = "\u00a1";
const BROADCAST_TEMPLATE =
  `bc &A&lSHOP &7| &e&L${INVERTED_EXCLAMATION}El jugador &a&l%player% &e&lha hecho una compra en la tienda &d&lshop.brotherspvp.net&e&l muchas gracias!`;

function now() {
  return Date.now();
}

function log(level: "info" | "warn" | "error", message: string, data: Record<string, unknown>) {
  const payload = { message, ...data, at: new Date().toISOString() };
  if (level === "error") return console.error("[delivery]", payload);
  if (level === "warn") return console.warn("[delivery]", payload);
  return console.info("[delivery]", payload);
}

function normalizeConsoleCommand(command: string) {
  return command.trim().replace(/^\/+/, "");
}

function applyPlayerTemplate(template: string, username: string) {
  return normalizeConsoleCommand(template.replaceAll("%player%", username));
}

function buildBroadcastCommand(username: string) {
  return applyPlayerTemplate(BROADCAST_TEMPLATE, username);
}

function validateDeliveryCommand(command: string) {
  const trimmed = normalizeConsoleCommand(command);
  const usernamePattern = "([A-Za-z0-9_]{3,16})";

  const patterns = [
    new RegExp(`^lp user ${usernamePattern} group set (vip|nemesis|apex|vortex|eon|oblivion|zenith|nyx|brothers|brothersplus)$`, "i"),
    new RegExp(`^lp user ${usernamePattern} group remove (vip|nemesis|apex|vortex|eon|oblivion|zenith|nyx|brothers|brothersplus)$`, "i"),
    new RegExp(`^Multiplier set Rank (?:[2-9]|10|11)\\.0 ${usernamePattern}$`, "i"),
    new RegExp(`^lp user ${usernamePattern} permission set ultracosmetics\\.allcosmetics$`, "i"),
    new RegExp(`^crate give p Brothers 7 ${usernamePattern}$`, "i"),
    new RegExp(`^crate give p SUCO 1 ${usernamePattern}$`, "i"),
    new RegExp(`^kit give bundle5 ${usernamePattern}$`, "i"),
    new RegExp(`^kit give reaper ${usernamePattern}$`, "i"),
    new RegExp(`^lootbox give ${usernamePattern} Premium 24$`, "i"),
    new RegExp(`^armadura give ${usernamePattern} boosteritem 1$`, "i"),
    new RegExp(`^azada add ${usernamePattern} 500000$`, "i"),
    new RegExp(`^Multiplier set Permanent 20\\.0 ${usernamePattern}$`, "i"),
    new RegExp(`^pet slotgive ${usernamePattern} (?:3|4|5)$`, "i"),
    new RegExp(
      `^bc &A&lSHOP &7\\| &e&L${INVERTED_EXCLAMATION}El jugador &a&l${usernamePattern} &e&lha hecho una compra en la tienda &d&lshop\\.brotherspvp\\.net&e&l muchas gracias!$`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(trimmed);
    if (!match) continue;

    const username = validateMinecraftUsername(match[1]);
    if (!username.ok) {
      return { ok: false as const, reason: username.reason };
    }

    return { ok: true as const, value: trimmed };
  }

  return { ok: false as const, reason: "Invalid delivery command." };
}

function delayForAttempt(attempt: number) {
  const exponent = Math.max(0, attempt - 1);
  return BASE_RETRY_MS * 2 ** exponent;
}

function scheduleRetryWorker() {
  if (!shouldRunRconWorker()) return;
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

function shouldRunRconWorker() {
  return env.DELIVERY_MODE === "rcon";
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
    const command = validateDeliveryCommand(task.command);
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
  if (!shouldRunRconWorker()) {
    log("info", "RCON delivery worker disabled", { deliveryMode: env.DELIVERY_MODE });
    return;
  }

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

  const deliveryCommands: Array<{ id: string; command: string }> = [];
  let hasProductDelivery = false;

  for (const line of order.items) {
    const product = getProductById(line.productId);
    if (!product) {
      log("warn", "Unknown product in order, skipping delivery", {
        orderId: order.id,
        productId: line.productId,
      });
      continue;
    }

    if (product.available === false) {
      log("warn", "Unavailable product in paid order, skipping delivery", {
        orderId: order.id,
        productId: product.id,
      });
      continue;
    }

    const templates = product.deliveryCommands ?? [];
    if (templates.length === 0) {
      log("warn", "Product has no delivery commands", {
        orderId: order.id,
        productId: product.id,
      });
      continue;
    }

    const repeats = product.category === "rank" || product.category === "upgrades" ? 1 : line.quantity;
    for (let copy = 0; copy < repeats; copy += 1) {
      for (let index = 0; index < templates.length; index += 1) {
        deliveryCommands.push({
          id: `${order.id}:${product.id}:${copy}:${index}`,
          command: applyPlayerTemplate(templates[index], username.value),
        });
      }
    }
    hasProductDelivery = true;
  }

  if (hasProductDelivery) {
    deliveryCommands.push({
      id: `${order.id}:broadcast`,
      command: buildBroadcastCommand(username.value),
    });
  }

  for (const task of deliveryCommands) {
    const existing = await upsertDeliveryTask({
      id: task.id,
      orderId: order.id,
      username: username.value,
      command: task.command,
    });
    if (existing.status === "delivered") {
      log("info", "Skipped duplicate delivery enqueue", {
        orderId: order.id,
        taskId: task.id,
        status: existing.status,
      });
      continue;
    }
    log("info", "Enqueued delivery task", {
      orderId: order.id,
      taskId: task.id,
      command: task.command,
    });
  }

  if (shouldRunRconWorker()) {
    void processQueue();
  } else {
    log("info", "Delivery tasks queued for external agent", {
      orderId: order.id,
      deliveryMode: env.DELIVERY_MODE,
      taskCount: deliveryCommands.length,
    });
  }
}

export async function getOrderDeliveryTasks(orderId: string) {
  return getTasksForOrder(orderId);
}

export function ensureQueueBootstrapped() {
  if (!shouldRunRconWorker()) return;
  if (bootstrapped) return;
  bootstrapped = true;
  log("info", "Starting delivery queue recovery", {});
  void processQueue();
}

if (process.env.NEXT_PHASE !== "phase-production-build") {
  ensureQueueBootstrapped();
}
