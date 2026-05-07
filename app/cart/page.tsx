"use client";

import Link from "next/link";
import { StoreShell } from "../_components/StoreShell";
import { useCart } from "../_components/cart";
import { formatUsd, getProductById } from "../lib/catalog";

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(99, Math.floor(value)));
}

export default function CartPage() {
  const { lines, remove, setQuantity, clear } = useCart();

  const enriched = lines
    .map((l) => {
      const product = getProductById(l.productId);
      if (!product) return null;
      return { ...l, product };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const subtotal = enriched.reduce(
    (acc, l) => acc + l.quantity * l.product.priceUsd,
    0,
  );

  return (
    <StoreShell
      title="Cart"
      subtitle="Review your items and adjust quantities. This is a demo checkout UI — no real payments."
      right={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <button
            type="button"
            className="mc-button mc-button-ghost h-10 px-4 text-sm"
            onClick={clear}
            disabled={enriched.length === 0}
          >
            Clear
          </button>
          <button
            type="button"
            className="mc-button h-10 px-4 text-sm"
            disabled={enriched.length === 0}
            onClick={() => {
              window.location.href = "/checkout";
            }}
          >
            Checkout
          </button>
        </div>
      }
    >
      <section className="container pb-14 sm:pb-16">
        {enriched.length === 0 ? (
          <div className="glass rounded-3xl p-8 sm:p-10">
            <div className="text-lg font-black text-white">Your cart is empty</div>
            <div className="mt-2 text-sm leading-6 text-white/70">
              Browse the store and add something awesome.
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="mc-button w-full sm:w-auto" href="/store">
                Go to store
              </Link>
              <Link className="mc-button mc-button-secondary w-full sm:w-auto" href="/ranks">
                Browse ranks
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="space-y-4">
                {enriched.map((l) => (
                  <div
                    key={l.productId}
                    className="group glass relative overflow-hidden rounded-3xl p-6 transition duration-300 hover:border-white/20"
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${l.product.gradientClass} opacity-0 transition duration-300 group-hover:opacity-100`}
                    />

                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white/60">
                          {l.product.badge ?? l.product.category.toUpperCase()}
                        </div>
                        <div className="mt-1 text-lg font-black text-white">
                          {l.product.name}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white/70">
                          {l.product.description}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                          <div className="text-[11px] font-semibold text-white/60">
                            Each
                          </div>
                          <div className="text-base font-black text-white">
                            {formatUsd(l.product.priceUsd)}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                          <div className="text-[11px] font-semibold text-white/60">
                            Qty
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              type="button"
                              className="grid size-9 place-items-center rounded-lg border border-white/10 bg-black/30 text-sm font-black text-white/85 transition hover:border-white/20 hover:bg-white/5 active:translate-y-px disabled:opacity-50"
                              onClick={() => setQuantity(l.productId, clampQuantity(l.quantity - 1))}
                              disabled={l.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <input
                              inputMode="numeric"
                              className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center text-sm font-black text-white outline-none transition focus:border-white/25"
                              value={l.quantity}
                              onChange={(e) =>
                                setQuantity(
                                  l.productId,
                                  clampQuantity(Number(e.target.value)),
                                )
                              }
                              aria-label="Quantity"
                            />
                            <button
                              type="button"
                              className="grid size-9 place-items-center rounded-lg border border-white/10 bg-black/30 text-sm font-black text-white/85 transition hover:border-white/20 hover:bg-white/5 active:translate-y-px"
                              onClick={() => setQuantity(l.productId, clampQuantity(l.quantity + 1))}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="mc-button mc-button-ghost h-10 px-4 text-sm"
                          onClick={() => remove(l.productId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="relative mt-4 text-sm font-semibold text-white/70">
                      Line total:{" "}
                      <span className="font-black text-white">
                        {formatUsd(l.quantity * l.product.priceUsd)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="glass sticky top-24 rounded-3xl p-6">
                <div className="text-lg font-black text-white">Summary</div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-white/70">
                    <span>Subtotal</span>
                    <span className="font-black text-white">{formatUsd(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold text-white/70">
                    <span>Fees</span>
                    <span className="font-black text-white">{formatUsd(0)}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center justify-between text-sm font-semibold text-white/70">
                    <span>Total</span>
                    <span className="text-lg font-black text-white">
                      {formatUsd(subtotal)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="mc-button mt-6 w-full"
                  onClick={() => {
                    window.location.href = "/checkout";
                  }}
                >
                  Checkout
                </button>

                <Link className="mc-button mc-button-ghost mt-3 w-full" href="/store">
                  Continue shopping
                </Link>

                <div className="mt-4 text-xs text-white/55">
                  Delivery happens automatically after checkout (demo).
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </StoreShell>
  );
}

