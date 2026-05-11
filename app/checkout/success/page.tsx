"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { useCart } from "../../_components/cart";
import { OrderSummary } from "../../_components/checkout/OrderSummary";
import { StoreShell } from "../../_components/StoreShell";
import { formatUsd } from "../../lib/catalog";
import {
  clearCheckoutDraft,
  clearCheckoutReceipt,
  loadCheckoutDraft,
  loadCheckoutReceipt,
  saveCheckoutReceipt,
} from "../lib/storage";
import type { CheckoutReceipt } from "../lib/types";

function paymentLabel(method: CheckoutReceipt["paymentMethod"]) {
  if (method === "paypal") return "PayPal";
  if (method === "mercadopago") return "Mercado Pago";
  return "Tarjeta";
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
    const username = searchParams.get("username") ?? draft?.username ?? "Sin usuario";
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

  const detailRows = receipt
    ? [
        { k: "Pedido", v: receipt.orderId },
        { k: "Usuario", v: receipt.username },
        { k: "Metodo", v: paymentLabel(receipt.paymentMethod) },
        { k: "Total", v: formatUsd(receipt.totalUsd) },
      ]
    : [];

  return (
    <StoreShell
      title="Pago recibido"
      subtitle="La confirmacion final se procesa desde el servidor. Si el pago queda aprobado, la entrega se encola automaticamente."
      right={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/store">
            Volver a la tienda
          </Link>
          <button
            type="button"
            className="mc-button h-10 px-4 text-sm"
            onClick={() => {
              clearCheckoutReceipt();
              window.location.href = "/store";
            }}
          >
            Listo
          </button>
        </div>
      }
    >
      <section className="container pb-14 sm:pb-16">
        {!receipt ? (
          <div className="checkout-surface p-8 sm:p-10">
            <div className="text-lg font-black text-white">No encontre el recibo</div>
            <div className="mt-2 text-sm leading-6 text-white/70">
              Si actualizaste la pagina despues del pago, puede faltar la informacion local del recibo.
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="mc-button w-full sm:w-auto" href="/store">
                Ir a la tienda
              </Link>
              <Link className="mc-button mc-button-ghost w-full sm:w-auto" href="/cart">
                Ver carrito
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="checkout-surface p-6 sm:p-8">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-white">Confirmacion</div>
                    <div className="mt-1 text-xs font-semibold text-white/60">
                      Guarda esta informacion por si necesitas soporte.
                    </div>
                  </div>
                  <div className="grid size-10 place-items-center rounded-md border border-emerald-300/30 bg-emerald-300/10 text-xs font-black text-emerald-200">
                    OK
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {detailRows.map((row) => (
                    <div
                      key={row.k}
                      className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-black/25 px-4 py-3"
                    >
                      <div className="text-sm font-semibold text-white/70">{row.k}</div>
                      <div className="text-sm font-black text-white">{row.v}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-xs leading-5 text-white/55">
                  La entrega depende del webhook del procesador de pago. Si queda pendiente, revisa nuevamente en unos minutos.
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-4">
                <OrderSummary
                  lines={[]}
                  subtotalUsd={receipt.subtotalUsd}
                  totalUsd={receipt.totalUsd}
                  compact
                />
                <div className="checkout-surface p-5">
                  <div className="text-sm font-black text-white">Entrega</div>
                  <div className="mt-2 text-xs font-semibold leading-6 text-white/65">
                    Los beneficios se aplican al usuario{" "}
                    <span className="font-black text-white">{receipt.username}</span> cuando el pago esta confirmado.
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
