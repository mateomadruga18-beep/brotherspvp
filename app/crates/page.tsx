import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function CratesPage() {
  const crates = getProductsByCategory("crate");

  return (
    <StoreShell
      title="Llaves"
      subtitle="Compra llaves premium para abrir crates dentro del servidor con entrega automatica."
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-5 xl:grid-cols-2">
          {crates.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              primaryCtaVariant="primary"
              motionDelay={index * 0.035}
            />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
