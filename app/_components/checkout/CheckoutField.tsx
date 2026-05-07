import React from "react";

export function CheckoutField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div className="text-sm font-black text-white">{label}</div>
        {hint && <div className="text-xs font-semibold text-white/55">{hint}</div>}
      </div>
      {children}
      {error ? (
        <div className="text-xs font-semibold text-amber-200/90">{error}</div>
      ) : null}
    </div>
  );
}

