"use client";

import Link from "next/link";
import { StoreShell } from "../_components/StoreShell";
import { useCart } from "../_components/cart";
import { formatUsd, getProductById, getProductPriceLabel } from "../lib/catalog";

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(99, Math.floor(value)));
}

export default function CartPage() {
  const { lines, remove, setQuantity, clear } = useCart();

  const enriched = lines
    .map((line) => {
      const product = getProductById(line.productId);
      if (!product || product.available === false) return null;
      return { ...line, product };
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));

  const subtotal = enriched.reduce(
    (acc, line) => acc + line.quantity * line.product.priceUsd,
    0,
  );

  return (
    <StoreShell
      title="Carrito"
      subtitle="Revisa tus productos antes de pagar. Las compras se entregan al usuario de Minecraft indicado en el checkout."
      right={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <button
            type="button"
            className="mc-button mc-button-ghost h-10 px-4 text-sm"
            onClick={clear}
            disabled={enriched.length === 0}
          >
            Vaciar
          </button>
          <button
            type="button"
            className="mc-button h-10 px-4 text-sm"
            disabled={enriched.length === 0}
            onClick={() => {
              window.location.href = "/checkout";
            }}
          >
            Pagar
          </button>
        </div>
      }
    >
      <section className="container pb-14 sm:pb-16">
        {enriched.length === 0 ? (
          <div className="checkout-surface p-8 sm:p-10">
            <div className="text-lg font-black text-white">Tu carrito esta vacio</div>
            <div className="mt-2 text-sm leading-6 text-white/70">
              Explora la tienda y agrega el rango, llave o exclusivo que quieras comprar.
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="mc-button w-full sm:w-auto" href="/store">
                Ir a la tienda
              </Link>
              <Link className="mc-button mc-button-secondary w-full sm:w-auto" href="/ranks">
                Ver rangos
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="space-y-4">
                {enriched.map((line) => (
                  <div
                    key={line.productId}
                    className="checkout-surface group p-5 transition duration-300 hover:border-white/20"
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${line.product.gradientClass} opacity-0 transition duration-300 group-hover:opacity-100`}
                    />

                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-xs font-black uppercase text-white/55">
                          {line.product.badge ?? line.product.category.toUpperCase()}
                        </div>
                        <div className="mt-1 text-lg font-black text-white">
                          {line.product.name}
                        </div>
                        <div className="mt-1 text-sm font-semibold leading-6 text-white/70">
                          {line.product.description}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-right">
                          <div className="text-[11px] font-bold uppercase text-white/55">
                            Unidad
                          </div>
                          <div className="text-base font-black text-white">
                            {getProductPriceLabel(line.product)}
                          </div>
                        </div>

                        <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2">
                          <div className="text-[11px] font-bold uppercase text-white/55">
                            Cantidad
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              type="button"
                              className="grid size-9 place-items-center rounded-md border border-white/10 bg-black/30 text-sm font-black text-white/85 transition hover:border-white/20 hover:bg-white/5 active:translate-y-px disabled:opacity-50"
                              onClick={() =>
                                setQuantity(line.productId, clampQuantity(line.quantity - 1))
                              }
                              disabled={line.quantity <= 1}
                              aria-label="Bajar cantidad"
                            >
                              -
                            </button>
                            <input
                              inputMode="numeric"
                              className="w-16 rounded-md border border-white/10 bg-black/30 px-2 py-2 text-center text-sm font-black text-white outline-none transition focus:border-white/25"
                              value={line.quantity}
                              onChange={(event) =>
                                setQuantity(
                                  line.productId,
                                  clampQuantity(Number(event.target.value)),
                                )
                              }
                              aria-label="Cantidad"
                            />
                            <button
                              type="button"
                              className="grid size-9 place-items-center rounded-md border border-white/10 bg-black/30 text-sm font-black text-white/85 transition hover:border-white/20 hover:bg-white/5 active:translate-y-px"
                              onClick={() =>
                                setQuantity(line.productId, clampQuantity(line.quantity + 1))
                              }
                              aria-label="Subir cantidad"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="mc-button mc-button-ghost h-10 px-4 text-sm"
                          onClick={() => remove(line.productId)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>

                    <div className="relative mt-4 text-sm font-semibold text-white/70">
                      Total de linea:{" "}
                      <span className="font-black text-white">
                        {formatUsd(line.quantity * line.product.priceUsd)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="checkout-surface sticky top-24 p-5">
                <div className="text-lg font-black text-white">Resumen</div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-white/70">
                    <span>Subtotal</span>
                    <span className="font-black text-white">{formatUsd(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold text-white/70">
                    <span>Cargos extra</span>
                    <span className="font-black text-white">{formatUsd(0)}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center justify-between text-sm font-semibold text-white/70">
                    <span>Total</span>
                    <span className="text-lg font-black text-white">{formatUsd(subtotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="mc-button mt-6 w-full"
                  onClick={() => {
                    window.location.href = "/checkout";
                  }}
                >
                  Ir a pagar
                </button>

                <Link className="mc-button mc-button-ghost mt-3 w-full" href="/store">
                  Seguir comprando
                </Link>

                <div className="mt-4 text-xs leading-5 text-white/55">
                  La entrega se procesa automaticamente cuando el pago queda confirmado.
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </StoreShell>
  );
}
