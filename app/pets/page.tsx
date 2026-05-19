import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function PetsPage() {
  const pets = getProductsByCategory("pet");

  return (
    <StoreShell
      title="Pets"
      subtitle="Huevos de pets premium para BrotherSPvP con entrega automatica al usuario de Minecraft indicado en checkout."
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-5 xl:grid-cols-2">
          {pets.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              primaryCtaVariant={product.id === "pet_universal_egg" ? "secondary" : "primary"}
              motionDelay={Math.min(index, 5) * 0.035}
            />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
