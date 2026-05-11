/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { FadeIn } from "./_components/Motion";
import { ProductCard } from "./_components/ProductCard";
import { StoreNavbar } from "./_components/StoreNavbar";
import { formatUsd, getFeaturedProduct } from "./lib/catalog";
import { getPaidBuyerStats } from "./server/repositories/ordersRepository";

export const dynamic = "force-dynamic";

const paymentMethods = [
  {
    name: "Tarjetas",
    description: "Visa, Mastercard, AmEx y Discover.",
    imageSrc: "/assets/payments/cards-real.jpg",
    imageAlt: "Tarjetas de credito y debito",
    imageClassName: "h-[4.2rem] max-w-none -translate-y-2 object-contain",
  },
  {
    name: "PayPal",
    description: "Pago internacional en USD.",
    imageSrc: "/assets/payments/paypal-real.jpg",
    imageAlt: "PayPal",
  },
  {
    name: "Mercado Pago",
    description: "Checkout local con pago en UYU.",
    imageSrc: "/assets/payments/mercadopago-real.svg",
    imageAlt: "Mercado Pago",
  },
];

function PlayerHead({ name }: { name: string }) {
  return (
    <span className="buyer-head group relative inline-flex" title={name}>
      <img
        src={`https://mc-heads.net/avatar/${encodeURIComponent(name)}/48`}
        alt={name}
        className="size-10 rounded-md border border-white/10 bg-black/40 object-cover"
        loading="lazy"
      />
      <span className="buyer-tooltip pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[calc(100%+0.45rem)] whitespace-nowrap rounded-md border border-amber-200/20 bg-black/85 px-2.5 py-1.5 text-xs font-black text-amber-100 opacity-0 shadow-[0_14px_34px_rgba(0,0,0,0.45)] backdrop-blur-md transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {name}
      </span>
    </span>
  );
}

export default async function Home() {
  const featuredProduct = getFeaturedProduct();
  const buyerStats = await getPaidBuyerStats().catch((error) => {
    console.error("[home] could not load paid buyer stats", error);
    return { recentBuyers: [], topBuyer: null };
  });
  const { recentBuyers, topBuyer } = buyerStats;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="animated-bg" aria-hidden="true">
        <div className="bg-grid" />
      </div>

      <StoreNavbar />

      <main className="flex-1">
        <section className="container py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
            <aside className="space-y-4">
              <FadeIn className="premium-panel p-5">
                <div className="text-xs font-black uppercase text-white/55">Owner del servidor</div>
                <div className="mt-4 flex items-center gap-4">
                  <img
                    src="https://mc-heads.net/body/ZZukit0/110"
                    alt="Skin completa de ZZukit0"
                    className="h-28 w-16 object-contain"
                  />
                  <div>
                    <div className="text-xl font-black text-white">ZZukit0</div>
                    <div className="mt-1 text-sm font-bold text-amber-200">OWNER</div>
                    <div className="mt-2 text-xs leading-5 text-white/60">
                      Responsable de BrotherSPvP y soporte principal de la tienda.
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeIn className="premium-panel p-5" delay={0.04}>
                <div className="text-xs font-black uppercase text-white/55">Top comprador</div>
                {topBuyer ? (
                  <div className="mt-4 flex items-center gap-4">
                    <img
                      src={`https://mc-heads.net/body/${encodeURIComponent(topBuyer.username)}/120`}
                      alt={`Top comprador ${topBuyer.username}`}
                      className="h-32 w-20 object-contain"
                      loading="lazy"
                    />
                    <div>
                      <div className="text-lg font-black text-[var(--foreground)]">
                        {topBuyer.username}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-emerald-200">
                        {formatUsd(topBuyer.totalUsd)} gastados
                      </div>
                      <div className="mt-2 text-xs leading-5 text-white/55">
                        {topBuyer.orderCount} compra{topBuyer.orderCount === 1 ? "" : "s"} confirmada
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border border-white/10 bg-black/25 px-4 py-4 text-sm leading-6 text-white/65">
                    Aun no hay compras confirmadas. Cuando alguien pague, aparece aca.
                  </div>
                )}
              </FadeIn>

              <FadeIn className="premium-panel p-5" delay={0.08}>
                <div className="text-xs font-black uppercase text-white/55">Ultimos compradores</div>
                {recentBuyers.length ? (
                  <div className="mt-4 grid grid-cols-7 gap-2">
                    {recentBuyers.map((buyer) => (
                      <PlayerHead key={buyer.username} name={buyer.username} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border border-white/10 bg-black/25 px-4 py-4 text-sm leading-6 text-white/65">
                    Sin compradores reales todavia.
                  </div>
                )}
              </FadeIn>

              <FadeIn className="premium-panel p-5" delay={0.12}>
                <div className="text-xs font-black uppercase text-white/55">Contactanos</div>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Soporte, dudas de compra o problemas de entrega.
                </p>
                <a
                  className="mt-3 block break-all text-sm font-black text-amber-200 transition hover:text-amber-100"
                  href="mailto:mateomadruga18@gmail.com"
                >
                  mateomadruga18@gmail.com
                </a>
              </FadeIn>
            </aside>

            <div className="min-w-0">
              <FadeIn className="home-hero">
                {featuredProduct.visual?.imageSrc ? (
                  <img
                    src={featuredProduct.visual.imageSrc}
                    alt=""
                    className="home-hero-bg"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="home-hero-overlay" aria-hidden="true" />
                <div className="home-hero-content">
                <img
                  src="/assets/brotherspvp-network-logo.png"
                  alt="BrotherSPvP Network"
                  className="home-logo mx-auto h-auto w-full max-w-md object-contain"
                />
                <div className="mx-auto mt-6 max-w-3xl">
                  <div className="mx-auto store-kicker">
                    Tienda oficial
                  </div>
                  <h1 className="gradient-title mt-4 text-4xl font-black leading-[0.98] sm:text-6xl">
                    DOMINA EL PRISON MAS EPICO
                  </h1>
                  <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 text-white/74 sm:text-base">
                    Pagos reales activos con PayPal y Mercado Pago. Las compras aprobadas se entregan al usuario de Minecraft indicado en checkout.
                  </p>
                </div>
                <div className="hero-badge-row mt-6 justify-center">
                  <span className="hero-badge">
                    <strong>Best Seller</strong> {featuredProduct.name}
                  </span>
                  <span className="hero-badge">
                    <strong>Prison OP</strong> 1.21
                  </span>
                  <span className="hero-badge">
                    <strong>Entrega</strong> automatica
                  </span>
                </div>

                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link className="mc-button w-full sm:w-auto" href="/exclusivos">
                    Ver exclusivos
                  </Link>
                  <Link className="mc-button mc-button-secondary w-full sm:w-auto" href="/ranks">
                    Ver rangos
                  </Link>
                  <Link className="mc-button mc-button-ghost w-full sm:w-auto" href="/crates">
                    Ver llaves
                  </Link>
                </div>
                </div>
              </FadeIn>

              <section className="mt-6">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="section-title">Paquete destacado</h2>
                    <p className="mt-1 text-sm leading-6 text-white/65">
                      Producto recomendado para progresar rapido dentro del servidor.
                    </p>
                  </div>
                  <Link className="section-link" href="/exclusivos">
                    Ver todos los exclusivos
                  </Link>
                </div>
                <ProductCard product={featuredProduct} primaryCtaVariant="secondary" motionDelay={0.06} />
              </section>

              <section className="mt-6 grid gap-4 xl:grid-cols-2">
                <FadeIn className="premium-panel p-5" delay={0.08}>
                  <div className="text-xs font-black uppercase text-white/55">
                    Metodos de pago disponibles
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.name}
                        className="rounded-md border border-white/10 bg-black/25 p-3 text-center"
                      >
                        <div className="grid h-16 place-items-center overflow-hidden rounded-md bg-white px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.24)]">
                          <img
                            src={method.imageSrc}
                            alt={method.imageAlt}
                            className={method.imageClassName ?? "max-h-12 w-full object-contain"}
                            loading="lazy"
                          />
                        </div>
                        <div className="mt-3 text-xs font-black text-white/88">{method.name}</div>
                        <div className="mt-1 text-[11px] font-semibold leading-4 text-white/55">
                          {method.description}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/65">
                    Aceptamos tarjetas, PayPal y Mercado Pago. PayPal cobra en USD y Mercado Pago convierte la compra a UYU.
                  </p>
                </FadeIn>

                <FadeIn className="premium-panel p-5" delay={0.12}>
                  <div className="text-xs font-black uppercase text-red-200">
                    Politica de reembolsos
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/70">
                    Todos los pagos son finales y no reembolsables. Al comprar aceptas que los beneficios digitales se entregan dentro del servidor. Los intentos de reembolso o contracargo pueden derivar en bloqueo permanente del servidor y de la tienda.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/store">
                      Terminos de compra
                    </Link>
                    <a className="mc-button h-10 px-4 text-sm" href="mailto:mateomadruga18@gmail.com">
                      Soporte
                    </a>
                  </div>
                </FadeIn>
              </section>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/25">
        <div className="container flex flex-col gap-3 py-9 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <div>BrotherSPvP Network. Tienda no afiliada con Mojang ni Microsoft.</div>
          <div className="flex items-center gap-5">
            <Link className="transition hover:text-white" href="/store">
              Tienda
            </Link>
            <Link className="transition hover:text-white" href="/exclusivos">
              Exclusivos
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
