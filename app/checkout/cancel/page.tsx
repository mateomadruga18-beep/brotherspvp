"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StoreShell } from "../../_components/StoreShell";
import { useToast } from "../../_components/toast";

export default function CheckoutCancelPage() {
  const { push } = useToast();

  useEffect(() => {
    push({
      title: "Checkout cancelado",
      message: "Tu carrito sigue guardado.",
      tone: "warning",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StoreShell
      title="Checkout cancelado"
      subtitle="No se proceso ningun pago. Puedes seguir comprando o volver al checkout."
      right={
        <Link className="mc-button h-10 px-4 text-sm" href="/checkout">
          Volver al checkout
        </Link>
      }
    >
      <section className="container pb-14 sm:pb-16">
        <div className="checkout-surface p-8 sm:p-10">
          <div className="text-sm font-semibold text-white/70">
            Si querias pagar, selecciona un metodo de pago y confirma nuevamente.
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="mc-button w-full sm:w-auto" href="/cart">
              Ver carrito
            </Link>
            <Link className="mc-button mc-button-ghost w-full sm:w-auto" href="/store">
              Seguir comprando
            </Link>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
