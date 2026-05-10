import Link from "next/link";
import { ProductCard } from "../_components/ProductCard";
import { StoreShell } from "../_components/StoreShell";
import { getProductsByCategory } from "../lib/catalog";

export default function StorePage() {
  const ranks = getProductsByCategory("rank");
  const crates = getProductsByCategory("crate");
  const coins = getProductsByCategory("coin");

  return (
    <StoreShell
      title="Tienda BrotherSPvP"
      subtitle="Compra rangos, llaves y monedas con entrega automatica despues de confirmar el pago. Los rangos ya incluyen todos sus beneficios y recompensas."
      right={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/cart">
            Ver carrito
          </Link>
          <Link className="mc-button h-10 px-4 text-sm" href="/ranks">
            Ver rangos
          </Link>
        </div>
      }
    >
      <section className="container pb-14 sm:pb-16">
        <div className="grid gap-12">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Rangos permanentes</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65 sm:text-base">
                  Diez rangos con identidad propia, colores del servidor y beneficios ordenados para comparar rapido.
                </p>
              </div>
              <Link className="text-sm font-semibold text-white/70 transition hover:text-white" href="/ranks">
                Comparar todos
              </Link>
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {ranks.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  primaryCtaVariant={index >= ranks.length - 2 ? "secondary" : "primary"}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Llaves de cajas</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65 sm:text-base">
                  Drops limitados, cosmeticos y premios para progresar dentro del servidor.
                </p>
              </div>
              <Link className="text-sm font-semibold text-white/70 transition hover:text-white" href="/crates">
                Ver cajas
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {crates.map((product) => (
                <ProductCard key={product.id} product={product} primaryCtaVariant="primary" />
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Monedas</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65 sm:text-base">
                  Packs de coins para subastas, economia y compras frecuentes.
                </p>
              </div>
              <Link className="text-sm font-semibold text-white/70 transition hover:text-white" href="/coins">
                Ver monedas
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {coins.map((product) => (
                <ProductCard key={product.id} product={product} primaryCtaVariant="primary" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
