"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { productId: string; quantity: number };

type CartState = {
  lines: CartLine[];
  add: (productId: string, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalItems: number;
};

const CartContext = createContext<CartState | null>(null);

const STORAGE_KEY = "brotherspvp_cart_v1";

function safeParseLines(value: string | null): CartLine[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((l) => ({
        productId: typeof l?.productId === "string" ? l.productId : "",
        quantity: typeof l?.quantity === "number" ? l.quantity : 0,
      }))
      .filter((l) => l.productId && Number.isFinite(l.quantity) && l.quantity > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedLines = safeParseLines(window.localStorage.getItem(STORAGE_KEY));
    queueMicrotask(() => {
      setLines(storedLines);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  const api = useMemo<CartState>(() => {
    function add(productId: string, quantity = 1) {
      setLines((prev) => {
        const qty = Math.max(1, Math.floor(quantity));
        const existing = prev.find((l) => l.productId === productId);
        if (!existing) return [...prev, { productId, quantity: qty }];
        return prev.map((l) =>
          l.productId === productId ? { ...l, quantity: l.quantity + qty } : l,
        );
      });
    }

    function remove(productId: string) {
      setLines((prev) => prev.filter((l) => l.productId !== productId));
    }

    function setQuantity(productId: string, quantity: number) {
      setLines((prev) => {
        const qty = Math.max(0, Math.floor(quantity));
        if (qty === 0) return prev.filter((l) => l.productId !== productId);
        const exists = prev.some((l) => l.productId === productId);
        if (!exists) return [...prev, { productId, quantity: qty }];
        return prev.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l));
      });
    }

    function clear() {
      setLines([]);
    }

    const totalItems = lines.reduce((acc, l) => acc + l.quantity, 0);

    return { lines, add, remove, setQuantity, clear, totalItems };
  }, [lines]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

