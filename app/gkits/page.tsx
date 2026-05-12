import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function GKitsPage() {
  const gkits = getProductsByCategory("gkit");

  return (
    <StoreShell
      title="GKits"
      subtitle="GKits premium con equipo, economia, boosts y recompensas completas para progresar fuerte en BrotherSPvP."
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-5 xl:grid-cols-2">
          {gkits.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              primaryCtaVariant="secondary"
              motionDelay={Math.min(index, 5) * 0.035}
            />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
