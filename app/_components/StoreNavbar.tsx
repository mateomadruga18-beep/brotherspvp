"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart";

const links = [
  { href: "/store", label: "Store" },
  { href: "/ranks", label: "Ranks" },
  { href: "/crates", label: "Crates" },
  { href: "/coins", label: "Coins" },
];

export function StoreNavbar() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/5">
            <span className="text-lg font-black tracking-tight">⛏</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-wide text-white">
              BrotherSPvP
            </div>
            <div className="text-xs text-white/60">store.brotherspvp.gg</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-white/70 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  "transition hover:text-white",
                  active ? "text-white" : "",
                ].join(" ")}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/cart">
            Cart
            <span className="ml-1 inline-flex min-w-6 items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-black text-white/85">
              {totalItems}
            </span>
          </Link>
          <Link className="mc-button h-10 px-4 text-sm" href="/store">
            Open store
          </Link>
        </div>
      </div>

      <div className="container pb-3 md:hidden">
        <div className="flex flex-wrap gap-2">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  active
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

