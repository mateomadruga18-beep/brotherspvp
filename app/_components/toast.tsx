"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type ToastTone = "success" | "info" | "warning";

export type Toast = {
  id: string;
  title: string;
  message?: string;
  tone?: ToastTone;
};

type ToastApi = {
  push: (toast: Omit<Toast, "id"> & { id?: string }) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

function randomId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function toneClasses(tone: ToastTone) {
  if (tone === "success") return "border-emerald-400/20 bg-emerald-400/10";
  if (tone === "warning") return "border-amber-400/25 bg-amber-400/10";
  return "border-sky-400/25 bg-sky-400/10";
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const api = useMemo<ToastApi>(() => {
    function push(t: Omit<Toast, "id"> & { id?: string }) {
      const id = t.id ?? randomId();
      setToasts((prev) => [{ id, ...t }, ...prev].slice(0, 4));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, 2600);
    }

    return { push };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 space-y-2 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "glass pointer-events-none overflow-hidden rounded-2xl px-4 py-3",
              "animate-[toast-in_180ms_ease-out]",
              toneClasses(t.tone ?? "info"),
            ].join(" ")}
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.06) inset, 0 18px 46px rgba(0,0,0,0.55)",
            }}
          >
            <div className="text-sm font-black text-white">{t.title}</div>
            {t.message && (
              <div className="mt-0.5 text-xs font-semibold text-white/70">
                {t.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

