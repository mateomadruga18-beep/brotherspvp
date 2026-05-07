import type { Product, ProductCategory } from "./storeTypes";

export type { Product, ProductCategory } from "./storeTypes";

export const catalog: Product[] = [
  {
    id: "rank_vip",
    category: "rank",
    name: "VIP",
    description: "Cosmetics, chat flair, and quality-of-life perks.",
    priceUsd: 4.99,
    badge: "Starter",
    gradientClass: "from-amber-300/25 via-orange-300/15 to-transparent",
    perks: ["+2 homes", "Colored chat", "Daily coin bonus"],
  },
  {
    id: "rank_vip_plus",
    category: "rank",
    name: "VIP+",
    description: "Priority queue and monthly key bonus.",
    priceUsd: 9.99,
    badge: "Best value",
    gradientClass: "from-violet-300/25 via-sky-300/15 to-transparent",
    perks: ["Queue priority", "+6 homes", "Monthly crate key"],
  },
  {
    id: "rank_brothers",
    category: "rank",
    name: "BROTHERS",
    description: "Premium perks with flex cosmetics and bigger bonuses.",
    priceUsd: 14.99,
    badge: "Premium",
    gradientClass: "from-emerald-300/25 via-cyan-300/15 to-transparent",
    perks: ["Exclusive cosmetics", "+10 homes", "2 monthly keys"],
  },
  {
    id: "rank_brothers_plus",
    category: "rank",
    name: "BROTHERS+",
    description: "Top-tier perks, prestige cosmetics, and best bonuses.",
    priceUsd: 24.99,
    badge: "Top tier",
    gradientClass: "from-fuchsia-400/25 via-indigo-400/15 to-transparent",
    perks: ["Highest priority", "+18 homes", "3 monthly keys"],
  },

  {
    id: "crate_mythic",
    category: "crate",
    name: "Mythic Crate Key",
    description: "Top-tier cosmetics, pets, and rare effects.",
    priceUsd: 3.49,
    badge: "Best loot",
    gradientClass: "from-fuchsia-400/25 via-sky-400/15 to-transparent",
  },
  {
    id: "crate_season",
    category: "crate",
    name: "Season Crate Key",
    description: "Limited seasonal rewards and rotating drops.",
    priceUsd: 2.49,
    badge: "Limited",
    gradientClass: "from-emerald-400/22 via-cyan-400/12 to-transparent",
  },
  {
    id: "crate_classic",
    category: "crate",
    name: "Classic Crate Key",
    description: "A reliable mix of cosmetics and fun rewards.",
    priceUsd: 1.99,
    badge: "Popular",
    gradientClass: "from-amber-400/20 via-orange-400/12 to-transparent",
  },
  {
    id: "crate_builder",
    category: "crate",
    name: "Builder Crate Key",
    description: "Particles, trails, and building-themed cosmetics.",
    priceUsd: 2.99,
    badge: "Style",
    gradientClass: "from-indigo-400/22 via-violet-400/12 to-transparent",
  },

  {
    id: "coins_10k",
    category: "coin",
    name: "10,000 Coins",
    description: "Great for auctions and small cosmetics.",
    priceUsd: 3.99,
    badge: "Quick top-up",
    gradientClass: "from-sky-400/22 via-indigo-400/12 to-transparent",
  },
  {
    id: "coins_50k",
    category: "coin",
    name: "50,000 Coins",
    description: "The sweet spot for bundles and cosmetics.",
    priceUsd: 14.99,
    badge: "+10% bonus",
    gradientClass: "from-violet-400/22 via-fuchsia-400/12 to-transparent",
  },
  {
    id: "coins_150k",
    category: "coin",
    name: "150,000 Coins",
    description: "Best value pack for big purchases.",
    priceUsd: 39.99,
    badge: "+25% bonus",
    gradientClass: "from-emerald-400/20 via-cyan-400/12 to-transparent",
  },
];

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getProductById(id: string) {
  return catalog.find((p) => p.id === id) ?? null;
}

export function getProductsByCategory(category: ProductCategory) {
  return catalog.filter((p) => p.category === category);
}

