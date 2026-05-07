"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { StoreShell } from "../../_components/StoreShell";
import { OrderSummary } from "../../_components/checkout/OrderSummary";
import { formatUsd } from "../../lib/catalog";
import {
  clearCheckoutDraft,
  clearCheckoutReceipt,
  loadCheckoutDraft,
  loadCheckoutReceipt,
  saveCheckoutReceipt,
} from "../lib/storage";
import type { CheckoutReceipt } from "../lib/types";
import { useCart } from "../../_components/cart";

function paymentLabel(method: CheckoutReceipt["paymentMethod"]) {
  if (method === "paypal") return "PayPal";
  if (method === "mercadopago") return "Mercado Pago";
  return "Credit / Debit Card";
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { clear } = useCart();
  const receipt = useMemo<CheckoutReceipt | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const gateway = searchParams.get("gateway");
    const existing = loadCheckoutReceipt();
    if (gateway !== "mercadopago") {
      return existing;
    }

    const draft = loadCheckoutDraft();
    const username = searchParams.get("username") ?? draft?.username ?? "Unknown";
    const amount = Number(searchParams.get("amount"));
    const totalUsd = Number.isFinite(amount) && amount > 0 ? amount : 0;
    const orderId =
      searchParams.get("external_reference") ??
      searchParams.get("merchant_order_id") ??
      searchParams.get("payment_id") ??
      "MP-PENDING";

    return {
      orderId,
      username,
      paymentMethod: "mercadopago",
      subtotalUsd: totalUsd,
      totalUsd,
      createdAt: 0,
    };
  }, [searchParams]);

  useEffect(() => {
    const gateway = searchParams.get("gateway");
    if (gateway !== "mercadopago" || !receipt) {
      return;
    }

    saveCheckoutReceipt(receipt);
    clearCheckoutDraft();
    clear();
  }, [clear, receipt, searchParams]);

  const lines = useMemo(() => {
    // Reconstruct minimal lines from catalog names stored in cart previously.
    // For demo: show just totals and metadata; line items were cleared on success.
    return [] as { productId: string; quantity: number }[];
  }, []);

  const detailRows = receipt
    ? [
        { k: "Order ID", v: receipt.orderId },
        { k: "Username", v: receipt.username },
        { k: "Payment", v: paymentLabel(receipt.paymentMethod) },
        { k: "Total", v: formatUsd(receipt.totalUsd) },
      ]
    : [];

  return (
    <StoreShell
      title="Payment received"
      subtitle="This page is informational. Final payment confirmation is handled server-side via webhooks."
      right={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/store">
            Back to store
          </Link>
          <button
            type="button"
            className="mc-button h-10 px-4 text-sm"
            onClick={() => {
              clearCheckoutReceipt();
              window.location.href = "/store";
            }}
          >
            Done
          </button>
        </div>
      }
    >
      <section className="container pb-14 sm:pb-16">
        {!receipt ? (
          <div className="glass rounded-3xl p-8 sm:p-10">
            <div className="text-lg font-black text-white">No receipt found</div>
            <div className="mt-2 text-sm leading-6 text-white/70">
              If you refreshed after checkout, the demo receipt may be missing.
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="mc-button w-full sm:w-auto" href="/store">
                Go to store
              </Link>
              <Link className="mc-button mc-button-ghost w-full sm:w-auto" href="/cart">
                View cart
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="glass rounded-3xl p-6 sm:p-8">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-white">Confirmation</div>
                    <div className="mt-1 text-xs font-semibold text-white/60">
                      Keep this info for support (demo).
                    </div>
                  </div>
                  <div className="grid size-10 place-items-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10 text-emerald-200">
                    ✓
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {detailRows.map((r) => (
                    <div
                      key={r.k}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className="text-sm font-semibold text-white/70">{r.k}</div>
                      <div className="text-sm font-black text-white">{r.v}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-xs text-white/55">
                  Next step later: replace this demo with a backend-created order and
                  gateway callback verification.
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-4">
                <OrderSummary
                  lines={lines}
                  subtotalUsd={receipt.subtotalUsd}
                  totalUsd={receipt.totalUsd}
                  compact
                />
                <div className="glass rounded-3xl p-6">
                  <div className="text-sm font-black text-white">Delivery</div>
                  <div className="mt-2 text-xs font-semibold leading-6 text-white/65">
                    Demo: your perks would be applied automatically to{" "}
                    <span className="font-black text-white">{receipt.username}</span>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </StoreShell>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

