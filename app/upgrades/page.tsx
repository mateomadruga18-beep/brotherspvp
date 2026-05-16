import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function UpgradesPage() {
  const upgrades = getProductsByCategory("upgrades");

  return (
    <StoreShell
      title="Upgrades VIP"
      subtitle="Paga solo la diferencia entre tu rango actual y el siguiente con 10% de descuento. La entrega quita el rango anterior y activa el nuevo."
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-5 xl:grid-cols-2">
          {upgrades.map((product, index) => (
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
