"use client";

import React, { useMemo, useState } from "react";
import { useCart } from "./cart";
import { useToast } from "./toast";
import { getProductById } from "../lib/catalog";

function variantClass(variant: "primary" | "secondary" | "ghost") {
  if (variant === "secondary") return "mc-button-secondary";
  if (variant === "ghost") return "mc-button-ghost";
  return "";
}

export function AddToCartButton({
  productId,
  quantity = 1,
  variant = "primary",
  className,
  children,
}: {
  productId: string;
  quantity?: number;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children: React.ReactNode;
}) {
  const { add } = useCart();
  const { push } = useToast();
  const [justAdded, setJustAdded] = useState(false);

  const label = useMemo(() => {
    if (!justAdded) return children;
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-grid size-5 place-items-center rounded-md bg-white/15 text-white/90">
          ✓
        </span>
        Added
      </span>
    );
  }, [children, justAdded]);

  return (
    <button
      type="button"
      className={["mc-button", variantClass(variant), className ?? ""].join(" ")}
      onClick={() => {
        add(productId, quantity);
        const p = getProductById(productId);
        const name = p?.name ?? "Item";
        push({
          title: "Added to cart",
          message:
            quantity > 1 ? `${name} × ${quantity}` : `${name} added successfully`,
          tone: "success",
        });
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 900);
      }}
    >
      {label}
    </button>
  );
}

