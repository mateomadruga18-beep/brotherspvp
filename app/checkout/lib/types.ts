export type PaymentMethod = "paypal" | "mercadopago";

export type CheckoutDraft = {
  username: string;
  paymentMethod: PaymentMethod | null;
  updatedAt: number;
};

export type CheckoutReceipt = {
  orderId: string;
  username: string;
  paymentMethod: PaymentMethod;
  subtotalUsd: number;
  totalUsd: number;
  createdAt: number;
};

