export type ProductCategory = "rank" | "crate" | "coin";

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

export type Product = {
  id: string;
  category: ProductCategory;
  name: string;
  description: string;
  priceUsd: number;
  badge?: string;
  gradientClass: string;
  perks?: string[];
  stats?: ProductStat[];
  rewards?: string[];
  commands?: string[];
  theme?: ProductTheme;
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

