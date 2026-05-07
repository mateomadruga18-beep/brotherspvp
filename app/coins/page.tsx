import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function CoinsPage() {
  const coins = getProductsByCategory("coin");

  return (
    <StoreShell
      title="Coins"
      subtitle="Stock up for auctions, cosmetics, and bundles. Choose a pack and add it to your cart."
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {coins.map((p) => (
            <ProductCard key={p.id} product={p} primaryCtaVariant="primary" />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}

