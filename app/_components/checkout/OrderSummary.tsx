import React from "react";
import Link from "next/link";
import { formatUsd, getProductById } from "../../lib/catalog";

export type SummaryLine = { productId: string; quantity: number };

export function OrderSummary({
  lines,
  subtotalUsd,
  totalUsd,
  compact = false,
}: {
  lines: SummaryLine[];
  subtotalUsd: number;
  totalUsd: number;
  compact?: boolean;
}) {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">Order summary</div>
          <div className="mt-1 text-xs font-semibold text-white/60">
            Instant delivery after payment (demo).
          </div>
        </div>
        {!compact && (
          <Link className="text-xs font-semibold text-white/70 transition hover:text-white" href="/cart">
            Edit cart →
          </Link>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {lines.map((l) => {
          const p = getProductById(l.productId);
          if (!p) return null;
          return (
            <div
              key={l.productId}
              className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <div className="text-sm font-black text-white">{p.name}</div>
                <div className="mt-0.5 text-xs font-semibold text-white/60">
                  Qty {l.quantity}
                </div>
              </div>
              <div className="text-sm font-black text-white">
                {formatUsd(p.priceUsd * l.quantity)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-sm font-semibold text-white/70">
          <span>Subtotal</span>
          <span className="font-black text-white">{formatUsd(subtotalUsd)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-semibold text-white/70">
          <span>Fees</span>
          <span className="font-black text-white">{formatUsd(0)}</span>
        </div>
        <div className="h-px bg-white/10" />
        <div className="flex items-center justify-between text-sm font-semibold text-white/70">
          <span>Total</span>
          <span className="text-lg font-black text-white">{formatUsd(totalUsd)}</span>
        </div>
      </div>
    </div>
  );
}

