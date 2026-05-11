import type { CSSProperties } from "react";
import Image from "next/image";
import type { Product } from "../lib/catalog";
import { getProductPriceLabel } from "../lib/catalog";
import { AddToCartButton } from "./buttons";
import { MotionProductCard } from "./Motion";

function productTone(product: Product) {
  if (!product.theme) return undefined;

  return {
    "--rank-accent": product.theme.accent,
    "--rank-accent-2": product.theme.accent2,
    "--rank-text": product.theme.text,
    "--rank-glow": product.theme.glow,
  } as CSSProperties;
}

function ProductArtwork({ product }: { product: Product }) {
  const visual = product.visual;
  const kind = visual?.kind ?? product.category;
  const imageSrc = visual?.imageSrc;

  return (
    <div className={`product-art product-art-${kind}`}>
      <div className="product-art-glow" aria-hidden="true" />
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={visual?.imageAlt ?? `Arte de ${product.name}`}
          width={220}
          height={220}
          sizes="9rem"
          className="product-art-image"
        />
      ) : (
        <div className="product-art-fallback" aria-hidden="true">
          {product.theme?.mark ?? product.name.slice(0, 2)}
        </div>
      )}
      <div className="product-art-shade" aria-hidden="true" />
      <div className="product-art-copy">
        <div className="product-art-title">{visual?.label ?? product.name}</div>
        <div className="product-art-detail">
          {visual?.detail ?? (product.category === "rank" ? "Permanente" : product.badge)}
        </div>
      </div>
      <div className="rank-art-band" />
    </div>
  );
}

export function ProductCard({
  product,
  primaryCtaVariant = "primary",
  motionDelay = 0,
}: {
  product: Product;
  primaryCtaVariant?: "primary" | "secondary" | "ghost";
  motionDelay?: number;
}) {
  const isAvailable = product.available !== false;

  return (
    <MotionProductCard
      className="product-card group relative rounded-lg border p-4"
      style={productTone(product)}
      delay={motionDelay}
    >
      <div
        className={`pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br ${product.gradientClass} opacity-0 transition duration-300 group-hover:opacity-100`}
      />
      <div className="pointer-events-none absolute inset-x-6 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-70" />

      <div className="relative">
        <div className="grid grid-cols-[7.75rem_1fr] gap-4 sm:grid-cols-[9.5rem_1fr]">
          <ProductArtwork product={product} />
          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase text-white/55">
                  {product.badge ?? product.category.toUpperCase()}
                </div>
                <h3 className="product-name mt-1 break-words text-2xl font-black text-white">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/68">
                  {product.description}
                </p>
              </div>

              <div className="product-price shrink-0 rounded-md px-3 py-2 text-left sm:text-right">
                <div className="text-[11px] font-bold uppercase text-white/55">Precio</div>
                <div className="text-base font-black text-white">{getProductPriceLabel(product)}</div>
              </div>
            </div>
          </div>
        </div>

          {product.stats?.length ? (
            <dl className="premium-stats mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-5">
              {product.stats.map((stat, index) => (
                <div
                  key={`${product.id}-${stat.label}`}
                  className={[
                    "premium-stat px-3 py-3",
                    product.stats && product.stats.length % 2 === 1 && index === product.stats.length - 1
                      ? "col-span-2 sm:col-span-1"
                      : "",
                  ].join(" ")}
                >
                  <dt className="text-[11px] font-bold uppercase text-white/45">{stat.label}</dt>
                  <dd className="mt-1 text-sm font-black text-[var(--rank-text)]">{stat.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {product.rewards?.length ? (
            <section className="mt-5 border-t border-white/10 pt-4">
              <div className="text-xs font-black uppercase text-[var(--rank-text)]">
                Incluye
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {product.rewards.map((reward) => (
                  <div key={`${product.id}-${reward}`} className="reward-pill flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white/78">
                    <span className="reward-dot size-1.5 shrink-0 rounded-full bg-[var(--rank-accent)]" />
                    <span>{reward}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {product.category === "rank" && product.commands?.length ? (
            <section className="mt-5 border-t border-white/10 pt-4">
              <div className="text-xs font-black uppercase text-[var(--rank-text)]">
                Comandos y beneficios
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.commands.map((command) => (
                  <span
                    key={`${product.id}-${command}`}
                    className="command-pill px-2.5 py-1.5 text-xs font-bold text-white/78"
                  >
                    {command}
                  </span>
                ))}
              </div>
            </section>
          ) : product.perks?.length ? (
            <section className="mt-5 border-t border-white/10 pt-4">
              <div className="grid gap-2">
                {product.perks.map((perk) => (
                  <div key={`${product.id}-${perk}`} className="reward-pill flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white/78">
                    <span className="size-1.5 shrink-0 rounded-full bg-white/55" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {isAvailable ? (
            <div className="mt-5">
              <AddToCartButton
                productId={product.id}
                variant={primaryCtaVariant}
                className="w-full"
              >
                Agregar al carrito
              </AddToCartButton>
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">
              {product.unavailableReason ?? "Producto pendiente de configurar."}
            </div>
          )}
      </div>
    </MotionProductCard>
  );
}
