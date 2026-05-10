export type ProductCategory = "rank" | "crate" | "exclusive";

export type ProductStat = {
  label: string;
  value: string;
};

export type ProductTheme = {
  accent: string;
  accent2: string;
  text: string;
  glow: string;
  mark: string;
};

export type ProductVisualKind =
  | "rank"
  | "crate"
  | "bundle"
  | "lootbox"
  | "booster"
  | "xp"
  | "money"
  | "cosmetics";

export type ProductVisual = {
  kind: ProductVisualKind;
  label: string;
  detail?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export type Product = {
  id: string;
  category: ProductCategory;
  name: string;
  description: string;
  priceUsd: number;
  priceLabel?: string;
  available?: boolean;
  unavailableReason?: string;
  badge?: string;
  gradientClass: string;
  perks?: string[];
  stats?: ProductStat[];
  rewards?: string[];
  commands?: string[];
  deliveryCommands?: string[];
  theme?: ProductTheme;
  visual?: ProductVisual;
  featured?: boolean;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type PaymentMethod = "paypal" | "mercadopago";

export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "created"
  | "validated"
  | "cancelled";

export type Order = {
  id: string;
  username: string;
  items: CartItem[];
  paymentMethod: PaymentMethod | null;
  status: OrderStatus;
  subtotalUsd: number;
  totalUsd: number;
  createdAt: number;
  updatedAt: number;
};

