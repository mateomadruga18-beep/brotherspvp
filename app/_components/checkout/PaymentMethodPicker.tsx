"use client";

import type { PaymentMethod } from "../../checkout/lib/types";

const methods: Array<{
  id: PaymentMethod;
  title: string;
  subtitle: string;
  badge: string;
  tone: string;
}> = [
  {
    id: "paypal",
    title: "PayPal",
    subtitle: "Paga con saldo PayPal o tarjeta vinculada.",
    badge: "Internacional",
    tone: "from-sky-400/22 via-indigo-400/12 to-transparent",
  },
  {
    id: "mercadopago",
    title: "Mercado Pago",
    subtitle: "Checkout Pro para Uruguay con pago en UYU.",
    badge: "Uruguay",
    tone: "from-emerald-400/20 via-cyan-400/12 to-transparent",
  },
];

export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {methods.map((method) => {
        const selected = value === method.id;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            className={[
              "group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-4 text-left transition duration-300",
              "hover:-translate-y-0.5 hover:border-white/20",
              selected ? "border-white/25 bg-white/10" : "",
            ].join(" ")}
            aria-pressed={selected}
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${method.tone} opacity-0 transition duration-300 group-hover:opacity-100`}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-white/60">{method.badge}</div>
                <div className="mt-1 text-sm font-black text-white">{method.title}</div>
                <div className="mt-1 text-xs font-semibold leading-5 text-white/65">
                  {method.subtitle}
                </div>
              </div>
              <div
                className={[
                  "mt-1 grid size-6 place-items-center rounded-full border text-[10px] font-black",
                  selected
                    ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-200"
                    : "border-white/15 bg-white/5 text-white/70",
                ].join(" ")}
              >
                {selected ? "OK" : ""}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
