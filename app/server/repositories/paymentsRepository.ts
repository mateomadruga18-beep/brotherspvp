import { PaymentProvider, Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { prisma } from "../db/prisma";

function log(message: string, data: Record<string, unknown>) {
  console.info("[db.payments]", { message, ...data, at: new Date().toISOString() });
}

export async function createPaymentReference(params: {
  provider: PaymentProvider;
  providerPaymentId: string;
  internalOrderId: string;
}) {
  try {
    const row = await prisma.paymentReference.create({
      data: {
        provider: params.provider,
        providerPaymentId: params.providerPaymentId,
        internalOrderId: params.internalOrderId,
      },
    });
    log("reference-created", {
      provider: row.provider,
      providerPaymentId: row.providerPaymentId,
      internalOrderId: row.internalOrderId,
    });
    return row;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      log("reference-duplicate", {
        provider: params.provider,
        providerPaymentId: params.providerPaymentId,
      });
      return prisma.paymentReference.findFirst({
        where: {
          provider: params.provider,
          providerPaymentId: params.providerPaymentId,
        },
      });
    }
    throw error;
  }
}

export async function findOrderIdByProviderPayment(params: {
  provider: PaymentProvider;
  providerPaymentId: string;
}) {
  const row = await prisma.paymentReference.findFirst({
    where: {
      provider: params.provider,
      providerPaymentId: params.providerPaymentId,
    },
    select: { internalOrderId: true },
  });
  return row?.internalOrderId ?? null;
}

export async function markWebhookEventProcessed(params: {
  provider: PaymentProvider;
  eventId: string;
  payload: unknown;
}) {
  const payloadHash = createHash("sha256")
    .update(JSON.stringify(params.payload ?? {}))
    .digest("hex");

  try {
    await prisma.webhookEvent.create({
      data: {
        provider: params.provider,
        eventId: params.eventId,
        payloadHash,
      },
    });
    log("webhook-processed", { provider: params.provider, eventId: params.eventId });
    return { inserted: true as const, payloadHash };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.webhookEvent.findFirst({
        where: {
          provider: params.provider,
          eventId: params.eventId,
        },
        select: {
          payloadHash: true,
        },
      });
      log("webhook-duplicate", {
        provider: params.provider,
        eventId: params.eventId,
        payloadMismatch: existing?.payloadHash !== payloadHash,
      });
      return {
        inserted: false as const,
        payloadHash,
        payloadMismatch: existing?.payloadHash !== payloadHash,
      };
    }
    throw error;
  }
}
