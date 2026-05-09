"use client";

import { useState } from "react";
import { useToast } from "../toast";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code: string; message: string } };

async function apiPost<T>(url: string, body: unknown): Promise<ApiOk<T> | ApiErr> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as ApiOk<T> | ApiErr;
  } catch {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Could not reach Mercado Pago right now. Try again in a moment.",
      },
    };
  }
}

export function MercadoPagoCheckoutButton({
  productName,
  price,
  username,
  items,
  disabled,
}: {
  productName: string;
  price: number;
  username: string;
  items: Array<{ productId: string; quantity: number }>;
  disabled: boolean;
}) {
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);

    try {
      const created = await apiPost<{ checkoutUrl: string; preferenceId: string }>(
        "/api/mercadopago/create-preference",
        {
          productName,
          price,
          username,
          items,
        },
      );

      if (!created.ok) {
        push({ title: "Mercado Pago error", message: created.error.message, tone: "warning" });
        return;
      }

      window.location.href = created.data.checkoutUrl;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="mc-button w-full"
      disabled={disabled || loading}
      onClick={startCheckout}
    >
      {loading ? "Creating Mercado Pago preference..." : "Pay with Mercado Pago"}
    </button>
  );
}
