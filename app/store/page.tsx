import Link from "next/link";
import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function StorePage() {
  const ranks = getProductsByCategory("rank");
  const crates = getProductsByCategory("crate");
  const exclusives = getProductsByCategory("exclusive");
  const gkits = getProductsByCategory("gkit");

  return (
    <StoreShell
      title="Tienda BrotherSPvP"
      subtitle="Compra rangos, llaves, exclusivos y GKits con entrega automatica despues de confirmar el pago."
      right={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/cart">
            Ver carrito
          </Link>
          <Link className="mc-button h-10 px-4 text-sm" href="/exclusivos">
            Exclusivos
          </Link>
          <Link className="mc-button mc-button-secondary h-10 px-4 text-sm" href="/gkits">
            GKits
          </Link>
        </div>
      }
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-12">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="section-title">Rangos permanentes</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65 sm:text-base">
                  Diez rangos con imagen personalizada, muneco por color y beneficios completos.
                </p>
              </div>
              <Link className="section-link" href="/ranks">
                Comparar rangos
              </Link>
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {ranks.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  primaryCtaVariant={index >= ranks.length - 2 ? "secondary" : "primary"}
                  motionDelay={Math.min(index, 5) * 0.035}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="section-title">Llaves</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65 sm:text-base">
                  La llave BROTHERS se entrega con x7 llaves para abrir crate dentro del servidor.
                </p>
              </div>
              <Link className="section-link" href="/crates">
                Ver llaves
              </Link>
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {crates.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  primaryCtaVariant="primary"
                  motionDelay={index * 0.035}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="section-title">Exclusivos</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65 sm:text-base">
                  Bundles, lootboxes, booster de armadura, slots de pet, XP de azada y accesos especiales.
                </p>
              </div>
              <Link className="section-link" href="/exclusivos">
                Ver exclusivos
              </Link>
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {exclusives.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  primaryCtaVariant={product.featured ? "secondary" : "primary"}
                  motionDelay={Math.min(index, 5) * 0.035}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="section-title">GKits</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65 sm:text-base">
                  Kits premium con equipo, economia, boosts y recompensas listas para dominar el Prison.
                </p>
              </div>
              <Link className="section-link" href="/gkits">
                Ver GKits
              </Link>
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {gkits.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  primaryCtaVariant="secondary"
                  motionDelay={Math.min(index, 5) * 0.035}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
