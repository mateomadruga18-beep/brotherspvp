"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../toast";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code: string; message: string } };
type LoadState = "loading" | "ready" | "error";
type PayPalEnvironment = "sandbox" | "live";

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
        message: "Could not reach the payment service. Try again in a moment.",
      },
    };
  }
}

export function PayPalCheckoutButton({
  username,
  items,
  disabled,
  onPaid,
  onCancelled,
}: {
  username: string;
  items: Array<{ productId: string; quantity: number }>;
  disabled: boolean;
  onPaid: (params: { orderId: string; paypalOrderId: string }) => void;
  onCancelled: () => void;
}) {
  const { push } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<PayPalEnvironment>("sandbox");
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState("loading");

      try {
        const res = await fetch("/api/paypal/config");
        const json = (await res.json()) as
          | ApiOk<{ clientId: string; environment: PayPalEnvironment }>
          | ApiErr;
        if (cancelled) return;

        if (json.ok) {
          setClientId(json.data.clientId);
          setEnvironment(json.data.environment);
          setLoadState("ready");
          return;
        }

        setClientId(null);
        setLoadState("error");
        push({ title: "PayPal not configured", message: json.error.message, tone: "warning" });
      } catch {
        if (cancelled) return;
        setClientId(null);
        setLoadState("error");
        push({
          title: "PayPal unavailable",
          message: "Could not load PayPal right now. Try again in a moment.",
          tone: "warning",
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [push]);

  const options = useMemo(() => {
    if (!clientId) return null;
    return {
      clientId,
      currency: "USD",
      intent: "capture",
    } as const;
  }, [clientId]);

  if (loadState === "error") {
    return (
      <button type="button" className="mc-button w-full opacity-80" disabled>
        PayPal unavailable
      </button>
    );
  }

  if (!options) {
    return (
      <button type="button" className="mc-button w-full opacity-80" disabled>
        Loading PayPal...
      </button>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      <PayPalScriptProvider options={options}>
        <div className="glass rounded-3xl p-4">
          <PayPalButtons
            style={{
              layout: "vertical",
              shape: "pill",
              label: "paypal",
            }}
            createOrder={async () => {
              const created = await apiPost<{ orderId: string; paypalOrderId: string }>(
                "/api/paypal/create-order",
                { username, items },
              );
              if (!created.ok) {
                push({ title: "Checkout error", message: created.error.message, tone: "warning" });
                throw new Error(created.error.message);
              }

              window.sessionStorage.setItem("bspvp_order_id", created.data.orderId);
              return created.data.paypalOrderId;
            }}
            onApprove={async (data) => {
              const orderId = window.sessionStorage.getItem("bspvp_order_id") ?? "";
              const paypalOrderId = String((data as { orderID?: string })?.orderID ?? "");
              if (!orderId || !paypalOrderId) {
                push({
                  title: "Approval error",
                  message: "Missing order identifiers.",
                  tone: "warning",
                });
                return;
              }

              const captured = await apiPost<{ order: unknown }>(
                "/api/paypal/capture-order",
                { orderId, paypalOrderId },
              );
              if (!captured.ok) {
                push({ title: "Payment failed", message: captured.error.message, tone: "warning" });
                return;
              }

              push({
                title: "Payment submitted",
                message: "We are confirming your payment. Redirecting...",
                tone: "info",
              });
              onPaid({ orderId, paypalOrderId });
            }}
            onCancel={() => {
              push({ title: "Payment cancelled", message: "No charges were made.", tone: "warning" });
              onCancelled();
            }}
            onError={(err) => {
              push({
                title: "PayPal error",
                message: err instanceof Error ? err.message : "Unknown error",
                tone: "warning",
              });
            }}
          />
          <div className="mt-2 text-xs font-semibold text-white/55">
            {environment === "live"
              ? "Live PayPal checkout. Payments are processed securely by PayPal."
              : "Sandbox mode. Use a PayPal Sandbox buyer account to test."}
          </div>
        </div>
      </PayPalScriptProvider>
    </div>
  );
}
