import type { CSSProperties } from "react";
import type { Product } from "../lib/catalog";
import { getProductPriceLabel } from "../lib/catalog";
import { AddToCartButton } from "./buttons";

function productTone(product: Product) {
  if (!product.theme) return undefined;

  return {
    "--rank-accent": product.theme.accent,
    "--rank-accent-2": product.theme.accent2,
    "--rank-text": product.theme.text,
    "--rank-glow": product.theme.glow,
  } as CSSProperties;
}

function RankArtwork({ product }: { product: Product }) {
  return (
    <div className="rank-art" aria-hidden="true">
      <div className="rank-art-grid" />
      <div className="rank-banner">
        <span>{product.name}</span>
      </div>
      <div className="rank-character">
        <div className="rank-character-head" />
        <div className="rank-character-body" />
        <div className="rank-character-arm rank-character-arm-left" />
        <div className="rank-character-arm rank-character-arm-right" />
        <div className="rank-character-leg rank-character-leg-left" />
        <div className="rank-character-leg rank-character-leg-right" />
      </div>
      <div className="rank-art-copy">
        <div className="rank-art-title">{product.name}</div>
        <div className="rank-art-subtitle">RANGO PERMANENTE</div>
      </div>
      <div className="rank-art-band" />
    </div>
  );
}

function PackageArtwork({ product }: { product: Product }) {
  const visual = product.visual;
  const kind = visual?.kind ?? product.category;

  return (
    <div className={`package-art package-art-${kind}`} aria-hidden="true">
      <div className="package-art-grid" />
      <div className="package-shine" />
      <div className="package-icon">
        <div className="package-icon-core">
          <span>{product.theme?.mark ?? product.name.slice(0, 2)}</span>
        </div>
      </div>
      <div className="package-art-copy">
        <div className="package-art-title">{visual?.label ?? product.name}</div>
        {visual?.detail ? <div className="package-art-detail">{visual.detail}</div> : null}
      </div>
      <div className="rank-art-band" />
    </div>
  );
}

function ProductArtwork({ product }: { product: Product }) {
  if (product.category === "rank") {
    return <RankArtwork product={product} />;
  }
  return <PackageArtwork product={product} />;
}

export function ProductCard({
  product,
  primaryCtaVariant = "primary",
}: {
  product: Product;
  primaryCtaVariant?: "primary" | "secondary" | "ghost";
}) {
  const isAvailable = product.available !== false;

  return (
    <article
      className="product-card group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-white/20"
      style={productTone(product)}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${product.gradientClass} opacity-0 transition duration-300 group-hover:opacity-100`}
      />

      <div className="relative">
        <ProductArtwork product={product} />

        <div className="mt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase text-white/55">
                {product.badge ?? product.category.toUpperCase()}
              </div>
              <h3 className="mt-1 break-words text-2xl font-black text-white">
                {product.name}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/68">
                {product.description}
              </p>
            </div>

            <div className="shrink-0 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-right">
              <div className="text-[11px] font-bold uppercase text-white/55">Precio</div>
              <div className="text-base font-black text-white">{getProductPriceLabel(product)}</div>
            </div>
          </div>

          {product.stats?.length ? (
            <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-5">
              {product.stats.map((stat) => (
                <div key={`${product.id}-${stat.label}`} className="bg-[#090d16]/90 px-3 py-3">
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
                  <div key={`${product.id}-${reward}`} className="flex items-center gap-2 text-sm font-semibold text-white/78">
                    <span className="size-1.5 shrink-0 rounded-full bg-[var(--rank-accent)]" />
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
                    className="rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs font-bold text-white/78"
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
                  <div key={`${product.id}-${perk}`} className="flex items-center gap-2 text-sm font-semibold text-white/78">
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
      </div>
    </article>
  );
}
