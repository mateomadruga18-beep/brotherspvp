"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "./cart";
import { MotionHeader } from "./Motion";

const links = [
  { href: "/store", label: "Tienda" },
  { href: "/ranks", label: "Rangos" },
  { href: "/crates", label: "Llaves" },
  { href: "/exclusivos", label: "Exclusivos" },
  { href: "/gkits", label: "GKits" },
];

export function StoreNavbar() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <MotionHeader className="premium-navbar">
      <div className="container flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="nav-brand flex min-w-0 items-center gap-3">
          <Image
            src="/assets/brotherspvp-network-logo.png"
            alt="BrotherSPvP Network"
            width={64}
            height={64}
            className="nav-brand-logo h-14 w-14 shrink-0 object-contain"
          />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-base font-black text-white">BrotherSPvP</div>
            <div className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-amber-100/70">
              play.brotherspvp.net
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-bold md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={["nav-link", active ? "nav-link-active" : ""].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link className="mc-button mc-button-ghost h-10 px-3 text-sm sm:px-4" href="/cart">
            Carrito
            <span className="cart-count ml-1 inline-flex min-w-6 items-center justify-center rounded-md px-2 py-0.5 text-xs font-black">
              {totalItems}
            </span>
          </Link>
          <Link className="nav-store-cta mc-button h-10 px-4 text-sm" href="/store">
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
                className={["mobile-nav-link", active ? "mobile-nav-link-active" : ""].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </MotionHeader>
  );
}
