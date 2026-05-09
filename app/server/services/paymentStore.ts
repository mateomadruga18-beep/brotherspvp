import { PaymentProvider } from "@/generated/prisma/client";
import {
  createPaymentReference,
  findOrderIdByProviderPayment,
  markWebhookEventProcessed,
} from "../repositories/paymentsRepository";

type Provider = "paypal" | "mercadopago";

function toProvider(provider: Provider): PaymentProvider {
  return provider;
}

export async function markEventProcessed(params: {
  provider: Provider;
  eventId: string;
  payload: unknown;
}) {
  return markWebhookEventProcessed({
    provider: toProvider(params.provider),
    eventId: params.eventId,
    payload: params.payload,
  });
}

export async function linkPaymentToOrder(provider: Provider, paymentId: string, orderId: string) {
  return createPaymentReference({
    provider: toProvider(provider),
    providerPaymentId: paymentId,
    internalOrderId: orderId,
  });
}

export async function getOrderIdForPayment(provider: Provider, paymentId: string) {
  return findOrderIdByProviderPayment({
    provider: toProvider(provider),
    providerPaymentId: paymentId,
  });
}
