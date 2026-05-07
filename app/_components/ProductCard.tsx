import React from "react";
import { Product, formatUsd } from "../lib/catalog";
import { AddToCartButton } from "./buttons";

export function ProductCard({
  product,
  primaryCtaVariant = "primary",
}: {
  product: Product;
  primaryCtaVariant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <div className="group glass relative overflow-hidden rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${product.gradientClass} opacity-0 transition duration-300 group-hover:opacity-100`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-white/60">
            {product.badge ?? product.category.toUpperCase()}
          </div>
          <div className="mt-1 text-xl font-black tracking-tight text-white">
            {product.name}
          </div>
          <div className="mt-2 text-sm font-semibold text-white/70">
            {product.description}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
          <div className="text-[11px] font-semibold text-white/60">Price</div>
          <div className="text-lg font-black text-white">
            {formatUsd(product.priceUsd)}
          </div>
        </div>
      </div>

      {product.perks?.length ? (
        <div className="relative mt-6 space-y-3">
          {product.perks.map((p) => (
            <div
              key={p}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="inline-grid size-6 place-items-center rounded-md bg-white/10 text-white/80">
                ✦
              </span>
              <div className="text-sm font-semibold text-white/80">{p}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70">
          Instant delivery • Safe checkout • Mobile-friendly
        </div>
      )}

      <div className="relative mt-6 flex gap-3">
        <AddToCartButton
          productId={product.id}
          variant={primaryCtaVariant}
          className="w-full"
        >
          Add to cart
        </AddToCartButton>
      </div>
    </div>
  );
}

