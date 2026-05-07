import type { CartItem } from "../../lib/storeTypes";
import { getProductById } from "../../lib/catalog";

export function computeTotalsUsd(items: CartItem[]) {
  let subtotal = 0;
  for (const it of items) {
    const p = getProductById(it.productId);
    if (!p) return { ok: false as const, reason: `Unknown product: ${it.productId}` };
    subtotal += p.priceUsd * it.quantity;
  }
  const total = subtotal;
  return { ok: true as const, subtotalUsd: round2(subtotal), totalUsd: round2(total) };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

