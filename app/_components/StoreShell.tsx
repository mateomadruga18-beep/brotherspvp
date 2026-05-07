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
          <section className="container py-10 sm:py-12">
            <div className="glass overflow-hidden rounded-3xl">
              <div className="grid gap-6 p-7 sm:p-10 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  {title && (
                    <h1 className="text-balance text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-white/70 sm:text-base">
                      {subtitle}
                    </p>
                  )}
                </div>
                {right && <div className="lg:col-span-4 lg:justify-self-end">{right}</div>}
              </div>
            </div>
          </section>
        )}

        {children}
      </main>

      <footer className="border-t border-white/10 bg-black/20">
        <div className="container flex flex-col gap-3 py-10 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <div>© BrotherSPvP. Not affiliated with Mojang or Microsoft.</div>
          <div className="flex items-center gap-5">
            <a className="transition hover:text-white" href="#">
              Terms
            </a>
            <a className="transition hover:text-white" href="#">
              Privacy
            </a>
            <a className="transition hover:text-white" href="#">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

