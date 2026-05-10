import React from "react";
import { StoreNavbar } from "./StoreNavbar";

export function StoreShell({
  children,
  title,
  subtitle,
  right,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="animated-bg" aria-hidden="true">
        <div className="bg-grid" />
      </div>

      <StoreNavbar />

      <main className="flex-1">
        {(title || subtitle || right) && (
          <section className="container py-9 sm:py-11">
            <div className="grid gap-5 border-b border-white/10 pb-7 sm:pb-9 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                {title && <h1 className="text-3xl font-black text-white sm:text-4xl">{title}</h1>}
                {subtitle && (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 sm:text-base">
                    {subtitle}
                  </p>
                )}
              </div>
              {right && <div className="lg:col-span-4 lg:justify-self-end">{right}</div>}
            </div>
          </section>
        )}

        {children}
      </main>

      <footer className="border-t border-white/10 bg-black/25">
        <div className="container flex flex-col gap-3 py-9 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <div>BrotherSPvP. Tienda no afiliada con Mojang ni Microsoft.</div>
          <div className="flex items-center gap-5">
            <a className="transition hover:text-white" href="#">
              Terminos
            </a>
            <a className="transition hover:text-white" href="#">
              Privacidad
            </a>
            <a className="transition hover:text-white" href="#">
              Soporte
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
