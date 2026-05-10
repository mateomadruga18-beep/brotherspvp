import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function CratesPage() {
  const crates = getProductsByCategory("crate");

  return (
    <StoreShell
      title="Llaves de cajas"
      subtitle="Compra llaves para abrir cajas con drops limitados, cosmeticos y recompensas especiales."
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          {crates.map((product) => (
            <ProductCard key={product.id} product={product} primaryCtaVariant="primary" />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
