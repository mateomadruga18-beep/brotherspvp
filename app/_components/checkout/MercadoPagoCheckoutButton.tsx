"use client";

import { useState } from "react";
import { useToast } from "../toast";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code: string; message: string } };

async function apiPost<T>(url: string, body: unknown): Promise<ApiOk<T> | ApiErr> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as ApiOk<T> | ApiErr;
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
    const created = await apiPost<{ checkoutUrl: string; preferenceId: string }>(
      "/api/mercadopago/create-preference",
      {
        productName,
        price,
        username,
        items,
      },
    );
    setLoading(false);

    if (!created.ok) {
      push({ title: "Mercado Pago error", message: created.error.message, tone: "warning" });
      return;
    }

    window.location.href = created.data.checkoutUrl;
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
