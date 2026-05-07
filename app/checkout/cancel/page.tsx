"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StoreShell } from "../../_components/StoreShell";
import { useToast } from "../../_components/toast";

export default function CheckoutCancelPage() {
  const { push } = useToast();

  useEffect(() => {
    push({
      title: "Checkout cancelled",
      message: "Your cart is still saved.",
      tone: "warning",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StoreShell
      title="Checkout cancelled"
      subtitle="No payment was processed. You can continue shopping or return to checkout."
      right={
        <Link className="mc-button h-10 px-4 text-sm" href="/checkout">
          Return to checkout
        </Link>
      }
    >
      <section className="container pb-14 sm:pb-16">
        <div className="glass rounded-3xl p-8 sm:p-10">
          <div className="text-sm font-semibold text-white/70">
            If you meant to pay, pick a method and confirm again.
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="mc-button w-full sm:w-auto" href="/cart">
              View cart
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

