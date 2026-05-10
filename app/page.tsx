import Link from "next/link";
import { ProductCard } from "./_components/ProductCard";
import { StoreNavbar } from "./_components/StoreNavbar";
import { getProductsByCategory } from "./lib/catalog";

export default function Home() {
  const ranks = getProductsByCategory("rank");
  const featuredRanks = ranks.filter((rank) =>
    ["rank_vip", "rank_eon", "rank_brothers", "rank_brothers_plus"].includes(rank.id),
  );

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="animated-bg" aria-hidden="true">
        <div className="bg-grid" />
      </div>

      <StoreNavbar />

      <main className="flex-1">
        <section className="container py-14 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-md border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-100">
                Tienda oficial de rangos BrotherSPvP
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl">
                Rangos, recompensas y beneficios listos para tu cuenta de Minecraft.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                Compra rangos permanentes con entrega automatica despues del pago. Cada rango muestra tag, multiplicador, descuento, Armor Boost, parcelas, recursos y comandos.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link className="mc-button w-full sm:w-auto" href="/ranks">
                  Ver rangos
                </Link>
                <Link className="mc-button mc-button-secondary w-full sm:w-auto" href="/store">
                  Abrir tienda
                </Link>
                <Link className="mc-button mc-button-ghost w-full sm:w-auto" href="/cart">
                  Ver carrito
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ["10", "rangos permanentes"],
                  ["UYU/USD", "pagos reales activos"],
                  ["RCON", "entrega preparada"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
                    <div className="text-xl font-black text-white">{value}</div>
                    <div className="mt-1 text-xs font-semibold uppercase text-white/55">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase text-white/55">Destacado</div>
                  <div className="mt-1 text-xl font-black text-white">BROTHERS+</div>
                </div>
                <Link className="text-sm font-semibold text-white/70 transition hover:text-white" href="/ranks">
                  Comparar
                </Link>
              </div>
              <ProductCard
                product={ranks.find((rank) => rank.id === "rank_brothers_plus") ?? ranks[0]}
                primaryCtaVariant="secondary"
              />
            </div>
          </div>
        </section>

        <section className="container py-12 sm:py-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Rangos principales</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65 sm:text-base">
                Una vista rapida de la progresion. En la pagina de rangos estan los 10 con todos los detalles.
              </p>
            </div>
            <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/ranks">
              Ver los 10 rangos
            </Link>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {featuredRanks.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                primaryCtaVariant={index >= 2 ? "secondary" : "primary"}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/25">
        <div className="container flex flex-col gap-3 py-9 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <div>BrotherSPvP. Tienda no afiliada con Mojang ni Microsoft.</div>
          <div className="flex items-center gap-5">
            <Link className="transition hover:text-white" href="/store">
              Tienda
            </Link>
            <Link className="transition hover:text-white" href="/ranks">
              Rangos
            </Link>
            <Link className="transition hover:text-white" href="/cart">
              Carrito
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
