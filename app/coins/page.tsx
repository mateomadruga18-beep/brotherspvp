import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function CoinsPage() {
  const coins = getProductsByCategory("coin");

  return (
    <StoreShell
      title="Monedas"
      subtitle="Recarga coins para subastas, cosmeticos y compras dentro del servidor. Elige un pack y agregalo al carrito."
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {coins.map((product) => (
            <ProductCard key={product.id} product={product} primaryCtaVariant="primary" />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
