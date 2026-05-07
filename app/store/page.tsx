import Link from "next/link";
import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function StorePage() {
  const ranks = getProductsByCategory("rank");
  const crates = getProductsByCategory("crate");
  const coins = getProductsByCategory("coin");

  return (
    <StoreShell
      title="Store"
      subtitle="Browse ranks, crate keys, and coins. Add items to your cart — instant delivery after checkout (demo)."
      right={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/cart">
            View cart
          </Link>
          <Link className="mc-button h-10 px-4 text-sm" href="/ranks">
            Browse ranks
          </Link>
        </div>
      }
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-10">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  Featured ranks
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/65 sm:text-base">
                  Hypixel-inspired presentation with crisp gradients and smooth hover motion.
                </p>
              </div>
              <Link className="hidden text-sm font-semibold text-white/70 transition hover:text-white sm:block" href="/ranks">
                See all →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {ranks.map((p, idx) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  primaryCtaVariant={idx === 1 ? "primary" : idx === 2 ? "secondary" : "ghost"}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  Crates
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/65 sm:text-base">
                  Limited drops and rare cosmetics. Keys deliver instantly (demo).
                </p>
              </div>
              <Link className="hidden text-sm font-semibold text-white/70 transition hover:text-white sm:block" href="/crates">
                See all →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {crates.map((p) => (
                <ProductCard key={p.id} product={p} primaryCtaVariant="primary" />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  Coins
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/65 sm:text-base">
                  Top up fast for auctions, cosmetics, and bundles.
                </p>
              </div>
              <Link className="hidden text-sm font-semibold text-white/70 transition hover:text-white sm:block" href="/coins">
                See all →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {coins.map((p) => (
                <ProductCard key={p.id} product={p} primaryCtaVariant="primary" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}

