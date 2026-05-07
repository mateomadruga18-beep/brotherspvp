import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function CratesPage() {
  const crates = getProductsByCategory("crate");

  return (
    <StoreShell
      title="Crates"
      subtitle="Keys for limited drops and rare cosmetics. Add keys to your cart — smooth interactions and instant delivery (demo)."
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          {crates.map((p) => (
            <ProductCard key={p.id} product={p} primaryCtaVariant="primary" />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}

