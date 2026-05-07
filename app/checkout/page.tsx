"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StoreShell } from "../_components/StoreShell";
import { CheckoutField } from "../_components/checkout/CheckoutField";
import { OrderSummary } from "../_components/checkout/OrderSummary";
import { PaymentMethodPicker } from "../_components/checkout/PaymentMethodPicker";
import { PayPalCheckoutButton } from "../_components/checkout/PayPalCheckoutButton";
import { MercadoPagoCheckoutButton } from "../_components/checkout/MercadoPagoCheckoutButton";
import { useCart } from "../_components/cart";
import { useToast } from "../_components/toast";
import type { CheckoutDraft, CheckoutReceipt, PaymentMethod } from "./lib/types";
import {
  clearCheckoutDraft,
  loadCheckoutDraft,
  saveCheckoutDraft,
  saveCheckoutReceipt,
} from "./lib/storage";
import { validateMinecraftUsername } from "./lib/validation";
import { getProductById } from "../lib/catalog";

function computeSubtotal(lines: { productId: string; quantity: number }[]) {
  return lines.reduce((acc, l) => {
    const p = getProductById(l.productId);
    if (!p) return acc;
    return acc + p.priceUsd * l.quantity;
  }, 0);
}

export default function CheckoutPage() {
  const { lines, clear } = useCart();
  const { push } = useToast();

  const cartLines = useMemo(
    () => lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    [lines],
  );

  const subtotalUsd = useMemo(() => computeSubtotal(cartLines), [cartLines]);
  const totalUsd = subtotalUsd;
  const mercadoPagoPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

  const [username, setUsername] = useState(
    () => (typeof window === "undefined" ? "" : loadCheckoutDraft()?.username ?? ""),
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    () => (typeof window === "undefined" ? null : loadCheckoutDraft()?.paymentMethod ?? null),
  );
  const [touched, setTouched] = useState(false);

  const usernameResult = useMemo(
    () => validateMinecraftUsername(username),
    [username],
  );

  const canPayWithPayPal = cartLines.length > 0 && usernameResult.ok;
  const canPayWithMercadoPago =
    cartLines.length > 0 && usernameResult.ok && Boolean(mercadoPagoPublicKey);
  const firstProduct = getProductById(cartLines[0]?.productId ?? "");
  const productName =
    cartLines.length === 1
      ? `${firstProduct?.name ?? "BrotherSPvP Item"} x${cartLines[0]?.quantity ?? 1}`
      : `${firstProduct?.name ?? "BrotherSPvP Item"} + ${cartLines.length - 1} more item(s)`;

  useEffect(() => {
    const draft: CheckoutDraft = {
      username,
      paymentMethod,
      updatedAt: Date.now(),
    };
    saveCheckoutDraft(draft);
  }, [username, paymentMethod]);

  if (cartLines.length === 0) {
    return (
      <StoreShell
        title="Checkout"
        subtitle="You can’t checkout with an empty cart."
        right={
          <Link className="mc-button h-10 px-4 text-sm" href="/store">
            Go to store
          </Link>
        }
      >
        <section className="container pb-14 sm:pb-16">
          <div className="glass rounded-3xl p-8 sm:p-10">
            <div className="text-sm font-semibold text-white/70">
              Add an item first, then come back here.
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="mc-button w-full sm:w-auto" href="/store">
                Browse store
              </Link>
              <Link className="mc-button mc-button-ghost w-full sm:w-auto" href="/cart">
                View cart
              </Link>
            </div>
          </div>
        </section>
      </StoreShell>
    );
  }

  return (
    <StoreShell
      title="Checkout"
      subtitle="Enter your Minecraft username and choose your payment method."
      right={
        <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/cart">
          Back to cart
        </Link>
      }
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="glass rounded-3xl p-6 sm:p-8">
              <div className="text-sm font-black text-white">Account details</div>
              <div className="mt-5">
                <CheckoutField
                  label="Minecraft username"
                  hint="3–16 chars, letters/numbers/_"
                  error={
                    touched && !usernameResult.ok ? usernameResult.reason : null
                  }
                >
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="e.g. Steve_123"
                    className={[
                      "w-full rounded-2xl border bg-black/30 px-4 py-3 text-sm font-semibold text-white outline-none transition",
                      touched && !usernameResult.ok
                        ? "border-amber-300/35 focus:border-amber-200/50"
                        : "border-white/10 focus:border-white/25",
                    ].join(" ")}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </CheckoutField>
              </div>

              <div className="mt-8">
                <div className="text-sm font-black text-white">Payment method</div>
                <div className="mt-3">
                  <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
                </div>
                <div className="mt-3 text-xs font-semibold text-white/55">
                  PayPal and Mercado Pago are available. Select one to continue.
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="mc-button mc-button-ghost w-full"
                  onClick={() => {
                    clearCheckoutDraft();
                    setUsername("");
                    setPaymentMethod(null);
                    push({ title: "Cleared checkout", message: "Draft reset.", tone: "info" });
                  }}
                >
                  Clear form
                </button>

                {paymentMethod === "paypal" ? (
                  <div className="sm:col-span-1">
                    <PayPalCheckoutButton
                      username={username}
                      items={cartLines}
                      disabled={!canPayWithPayPal}
                      onCancelled={() => {
                        window.location.href = "/checkout/cancel";
                      }}
                      onPaid={({ orderId }) => {
                        const receipt: CheckoutReceipt = {
                          orderId,
                          username: usernameResult.ok ? usernameResult.value : username,
                          paymentMethod: "paypal",
                          subtotalUsd,
                          totalUsd,
                          createdAt: Date.now(),
                        };
                        saveCheckoutReceipt(receipt);
                        clearCheckoutDraft();
                        clear();
                        window.location.href = "/checkout/success";
                      }}
                    />
                  </div>
                ) : paymentMethod === "mercadopago" ? (
                  <MercadoPagoCheckoutButton
                    productName={productName}
                    price={totalUsd}
                    username={username}
                    items={cartLines}
                    disabled={!canPayWithMercadoPago}
                  />
                ) : (
                  <button
                    type="button"
                    className="mc-button w-full"
                    disabled
                    onClick={() => {}}
                  >
                    Select a payment method to pay
                  </button>
                )}
              </div>

              <div className="mt-4 text-xs text-white/55">
                By confirming, you agree to store terms (demo).
              </div>
            </div>

            <div className="mt-4 glass rounded-3xl p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-white">Need to cancel?</div>
                  <div className="mt-1 text-xs font-semibold text-white/60">
                    Cancelling keeps your cart and draft data intact.
                  </div>
                </div>
                <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/checkout/cancel">
                  Cancel
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <OrderSummary
                lines={cartLines}
                subtotalUsd={subtotalUsd}
                totalUsd={totalUsd}
              />
              <div className="glass rounded-3xl p-6">
                <div className="text-sm font-black text-white">Security</div>
                <div className="mt-2 text-xs font-semibold leading-6 text-white/65">
                  This is a UI demo. For real payments later, you’ll integrate a
                  gateway and only store non-sensitive metadata client-side.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}

