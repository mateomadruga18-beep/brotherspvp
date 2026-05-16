export type ProductCategory = "rank" | "crate" | "exclusive" | "gkit" | "upgrades";

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
  | "cosmetics"
  | "pet-slot"
  | "gkit"
  | "upgrade";

export type ProductVisual = {
  kind: ProductVisualKind;
  label: string;
  detail?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export type ProductUpgradeVisual = {
  fromLabel: string;
  toLabel: string;
  fromImageSrc?: string;
  fromImageAlt?: string;
  toImageSrc?: string;
  toImageAlt?: string;
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
  upgradeVisual?: ProductUpgradeVisual;
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
  payerEmail?: string | null;
  payerName?: string | null;
  payerId?: string | null;
  providerStatus?: string | null;
  clientIp?: string | null;
  clientIpHash?: string | null;
  userAgent?: string | null;
  checkoutRequestId?: string | null;
  paidAt?: number | null;
  failedAt?: number | null;
  createdAt: number;
  updatedAt: number;
};

