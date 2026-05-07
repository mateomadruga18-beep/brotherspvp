"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StoreShell } from "../../_components/StoreShell";
import { useToast } from "../../_components/toast";

export default function CheckoutPendingPage() {
  const { push } = useToast();

  useEffect(() => {
    push({
      title: "Payment pending",
      message: "Mercado Pago is still confirming your payment.",
      tone: "info",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StoreShell
      title="Payment pending"
      subtitle="Your payment is under review. Come back in a moment to verify status."
      right={
        <Link className="mc-button h-10 px-4 text-sm" href="/checkout">
          Back to checkout
        </Link>
      }
    >
      <section className="container pb-14 sm:pb-16">
        <div className="glass rounded-3xl p-8 sm:p-10">
          <div className="text-sm font-semibold text-white/70">
            You can keep browsing while Mercado Pago processes this payment.
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="mc-button w-full sm:w-auto" href="/checkout">
              Check again
            </Link>
            <Link className="mc-button mc-button-ghost w-full sm:w-auto" href="/store">
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
