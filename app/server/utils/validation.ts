import type { CartItem, PaymentMethod } from "../../lib/storeTypes";
import { getProductById } from "../../lib/catalog";

export function sanitizeUserString(value: unknown, maxLength = 120) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function validateMinecraftUsername(username: unknown) {
  const value = sanitizeUserString(username, 32);
  if (!value) return { ok: false as const, reason: "Enter your Minecraft username." };
  if (value.length < 3 || value.length > 16) {
    return { ok: false as const, reason: "Username must be 3-16 characters." };
  }
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    return {
      ok: false as const,
      reason: "Only letters, numbers, and underscore are allowed.",
    };
  }
  return { ok: true as const, value };
}

export function validateCartItems(items: unknown) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false as const, reason: "Cart is empty." };
  }

  if (items.length > 25) {
    return { ok: false as const, reason: "Cart is too large." };
  }

  const sanitized: CartItem[] = [];

  for (const it of items) {
    if (!it || typeof it !== "object") {
      return { ok: false as const, reason: "Invalid cart item." };
    }

    const productId = sanitizeUserString((it as { productId?: unknown }).productId, 80);
    if (!productId) {
      return { ok: false as const, reason: "Invalid product id." };
    }

    const product = getProductById(productId);
    if (!product) {
      return { ok: false as const, reason: "Unknown product in cart." };
    }
    if (product.available === false) {
      return { ok: false as const, reason: `${product.name} is not available yet.` };
    }

    const quantity = Number((it as { quantity?: unknown }).quantity);
    if (!Number.isInteger(quantity)) {
      return { ok: false as const, reason: "Invalid quantity." };
    }
    if (quantity < 1 || quantity > 99) {
      return { ok: false as const, reason: "Quantity must be between 1 and 99." };
    }

    sanitized.push({
      productId,
      quantity,
    });
  }

  return { ok: true as const, value: sanitized };
}

export function validatePaymentMethod(method: unknown): method is PaymentMethod {
  return method === "paypal" || method === "mercadopago";
}

export function validateInternalOrderId(value: unknown) {
  const orderId = sanitizeUserString(value, 32).toUpperCase();
  if (!/^BSPVP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(orderId)) {
    return { ok: false as const, reason: "Invalid order id." };
  }
  return { ok: true as const, value: orderId };
}

export function validateExternalReference(value: unknown, fieldName: string) {
  const normalized = sanitizeUserString(value, 128);
  if (!normalized) {
    return { ok: false as const, reason: `${fieldName} is required.` };
  }

  if (!/^[A-Za-z0-9:_./-]+$/.test(normalized)) {
    return { ok: false as const, reason: `Invalid ${fieldName}.` };
  }

  return { ok: true as const, value: normalized };
}
