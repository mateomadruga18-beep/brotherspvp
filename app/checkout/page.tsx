"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MercadoPagoCheckoutButton } from "../_components/checkout/MercadoPagoCheckoutButton";
import { PayPalCheckoutButton } from "../_components/checkout/PayPalCheckoutButton";
import { CheckoutField } from "../_components/checkout/CheckoutField";
import { OrderSummary } from "../_components/checkout/OrderSummary";
import { PaymentMethodPicker } from "../_components/checkout/PaymentMethodPicker";
import { StoreShell } from "../_components/StoreShell";
import { useCart } from "../_components/cart";
import { useToast } from "../_components/toast";
import { getProductById } from "../lib/catalog";
import type { CheckoutDraft, CheckoutReceipt, PaymentMethod } from "./lib/types";
import {
  clearCheckoutDraft,
  loadCheckoutDraft,
  saveCheckoutDraft,
  saveCheckoutReceipt,
} from "./lib/storage";
import { validateMinecraftUsername } from "./lib/validation";

function computeSubtotal(lines: { productId: string; quantity: number }[]) {
  return lines.reduce((acc, line) => {
    const product = getProductById(line.productId);
    if (!product) return acc;
    return acc + product.priceUsd * line.quantity;
  }, 0);
}

export default function CheckoutPage() {
  const { lines, clear } = useCart();
  const { push } = useToast();

  const cartLines = useMemo(
    () => lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
    [lines],
  );

  const subtotalUsd = useMemo(() => computeSubtotal(cartLines), [cartLines]);
  const totalUsd = subtotalUsd;

  const [username, setUsername] = useState(
    () => (typeof window === "undefined" ? "" : loadCheckoutDraft()?.username ?? ""),
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    () => (typeof window === "undefined" ? null : loadCheckoutDraft()?.paymentMethod ?? null),
  );
  const [touched, setTouched] = useState(false);

  const usernameResult = useMemo(() => validateMinecraftUsername(username), [username]);

  const canPayWithPayPal = cartLines.length > 0 && usernameResult.ok;
  const canPayWithMercadoPago = cartLines.length > 0 && usernameResult.ok;
  const firstProduct = getProductById(cartLines[0]?.productId ?? "");
  const productName =
    cartLines.length === 1
      ? `${firstProduct?.name ?? "Producto BrotherSPvP"} x${cartLines[0]?.quantity ?? 1}`
      : `${firstProduct?.name ?? "Producto BrotherSPvP"} + ${cartLines.length - 1} mas`;

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
        subtitle="No puedes pagar con el carrito vacio."
        right={
          <Link className="mc-button h-10 px-4 text-sm" href="/store">
            Ir a la tienda
          </Link>
        }
      >
        <section className="container pb-14 sm:pb-16">
          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-8 sm:p-10">
            <div className="text-sm font-semibold text-white/70">
              Agrega un producto primero y vuelve al checkout.
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="mc-button w-full sm:w-auto" href="/store">
                Explorar tienda
              </Link>
              <Link className="mc-button mc-button-ghost w-full sm:w-auto" href="/cart">
                Ver carrito
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
      subtitle="Ingresa tu nombre de Minecraft y elige como pagar. PayPal cobra en USD y Mercado Pago convierte el total a UYU."
      right={
        <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/cart">
          Volver al carrito
        </Link>
      }
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-lg border border-white/10 bg-white/[0.055] p-6 sm:p-8">
              <div className="text-sm font-black text-white">Datos de la cuenta</div>
              <div className="mt-5">
                <CheckoutField
                  label="Usuario de Minecraft"
                  hint="3 a 16 caracteres: letras, numeros y guion bajo"
                  error={touched && !usernameResult.ok ? usernameResult.reason : null}
                >
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="Ej: Steve_123"
                    className={[
                      "w-full rounded-md border bg-black/30 px-4 py-3 text-sm font-semibold text-white outline-none transition",
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
                <div className="text-sm font-black text-white">Metodo de pago</div>
                <div className="mt-3">
                  <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
                </div>
                <div className="mt-3 text-xs font-semibold text-white/55">
                  Elige PayPal o Mercado Pago para continuar.
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
                    push({
                      title: "Checkout reiniciado",
                      message: "Formulario limpiado correctamente.",
                      tone: "info",
                    });
                  }}
                >
                  Limpiar formulario
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
                  <button type="button" className="mc-button w-full" disabled>
                    Selecciona un metodo para pagar
                  </button>
                )}
              </div>

              <div className="mt-4 text-xs leading-5 text-white/55">
                Al confirmar aceptas que la compra se entregue al usuario indicado.
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.055] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-white">Quieres cancelar?</div>
                  <div className="mt-1 text-xs font-semibold text-white/60">
                    Cancelar conserva tu carrito para que puedas volver despues.
                  </div>
                </div>
                <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/checkout/cancel">
                  Cancelar
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <OrderSummary lines={cartLines} subtotalUsd={subtotalUsd} totalUsd={totalUsd} />
              <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5">
                <div className="text-sm font-black text-white">Seguridad</div>
                <div className="mt-2 text-xs font-semibold leading-6 text-white/65">
                  No guardamos secretos de pago en el navegador. La confirmacion final se procesa del lado del servidor.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
