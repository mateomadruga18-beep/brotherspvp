"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StoreShell } from "../../_components/StoreShell";
import { useToast } from "../../_components/toast";

export default function CheckoutPendingPage() {
  const { push } = useToast();

  useEffect(() => {
    push({
      title: "Pago pendiente",
      message: "Mercado Pago todavia esta confirmando el pago.",
      tone: "info",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StoreShell
      title="Pago pendiente"
      subtitle="Tu pago esta en revision. Cuando Mercado Pago lo confirme, la entrega se procesa desde el servidor."
      right={
        <Link className="mc-button h-10 px-4 text-sm" href="/checkout">
          Volver al checkout
        </Link>
      }
    >
      <section className="container pb-14 sm:pb-16">
        <div className="rounded-lg border border-white/10 bg-white/[0.055] p-8 sm:p-10">
          <div className="text-sm font-semibold text-white/70">
            Puedes seguir navegando mientras Mercado Pago procesa el pago.
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="mc-button w-full sm:w-auto" href="/checkout">
              Revisar otra vez
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
