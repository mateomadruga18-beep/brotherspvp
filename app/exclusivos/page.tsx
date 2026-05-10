import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function ExclusivosPage() {
  const products = getProductsByCategory("exclusive");

  return (
    <StoreShell
      title="Exclusivos"
      subtitle="Bundles, lootboxes, boosters y accesos especiales para progresar mas rapido dentro de BrotherSPvP."
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-5 xl:grid-cols-2">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              primaryCtaVariant={product.featured ? "secondary" : "primary"}
            />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
