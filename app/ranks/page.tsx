import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function RanksPage() {
  const ranks = getProductsByCategory("rank");

  return (
    <StoreShell
      title="DOMINA EL PRISON MAS EPICO"
      subtitle="Elige tu rango permanente para BrotherSPvP. Cada rango incluye tag, multiplicador, descuento de RankUP, Armor Boost, parcelas, recursos de compra y comandos exclusivos."
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-5 xl:grid-cols-2">
          {ranks.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              primaryCtaVariant={index >= ranks.length - 2 ? "secondary" : "primary"}
              motionDelay={Math.min(index, 5) * 0.035}
            />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
