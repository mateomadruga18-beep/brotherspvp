import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function RanksPage() {
  const ranks = getProductsByCategory("rank");

  return (
    <StoreShell
      title="Ranks"
      subtitle="Permanent upgrades with cosmetics and quality-of-life commands. Pick a rank and add it to your cart."
    >
      <section className="container pb-14 sm:pb-16">
        <div className="mt-2 grid gap-4 lg:grid-cols-3">
          {ranks.map((p, idx) => (
            <ProductCard
              key={p.id}
              product={p}
              primaryCtaVariant={idx === 1 ? "primary" : idx === 2 ? "secondary" : "ghost"}
            />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}

