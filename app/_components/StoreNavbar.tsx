"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "./cart";

const links = [
  { href: "/store", label: "Tienda" },
  { href: "/ranks", label: "Rangos" },
  { href: "/crates", label: "Llaves" },
  { href: "/exclusivos", label: "Exclusivos" },
];

export function StoreNavbar() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07080b]/88 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/assets/brotherspvp-logo.png"
            alt="BrotherSPvP Network"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-extrabold text-white">BrotherSPvP</div>
            <div className="truncate text-xs text-white/60">play.brotherspvp.net</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-white/70 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={["transition hover:text-white", active ? "text-white" : ""].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link className="mc-button mc-button-ghost h-10 px-3 text-sm sm:px-4" href="/cart">
            Carrito
            <span className="ml-1 inline-flex min-w-6 items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-black text-white/85">
              {totalItems}
            </span>
          </Link>
          <Link className="mc-button hidden h-10 px-4 text-sm sm:inline-flex" href="/store">
            Tienda
          </Link>
        </div>
      </div>

      <div className="container pb-3 md:hidden">
        <div className="flex flex-wrap gap-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "rounded-md border px-3 py-1 text-xs font-semibold transition",
                  active
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
