import React from "react";
import { FadeIn } from "./Motion";
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
          <section className="page-hero">
            <div className="container page-hero-inner">
              <FadeIn className="page-hero-card max-w-4xl">
                <div className="store-kicker">BrotherSPvP Prison OP</div>
                {title && (
                  <h1 className="gradient-title mt-4 text-4xl font-black leading-[0.98] tracking-normal sm:text-5xl lg:text-6xl">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-white/72 sm:text-base">
                    {subtitle}
                  </p>
                )}
                <div className="hero-badge-row mt-5">
                  <span className="hero-badge">
                    <strong>Prison OP</strong> 1.21
                  </span>
                  <span className="hero-badge">
                    <strong>Entrega</strong> automatica
                  </span>
                  <span className="hero-badge">
                    <strong>Checkout</strong> seguro
                  </span>
                </div>
              </FadeIn>
              {right && <FadeIn className="lg:justify-self-end" delay={0.08}>{right}</FadeIn>}
            </div>
          </section>
        )}

        {children}
      </main>

      <footer className="border-t border-white/10 bg-black/35 backdrop-blur-md">
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
