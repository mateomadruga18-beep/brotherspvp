import type { CartItem } from "../../../lib/storeTypes";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { env } from "../../../server/env";
import { registerPaymentReference } from "../../../server/services/paymentConfirmation";
import { createOrder } from "../../../server/services/orders";
import { readJsonBody } from "../../../server/security/body";
import { hashIdentifier } from "../../../server/security/request";
import { enforceRateLimit } from "../../../server/security/rateLimit";
import { applyRouteSecurity } from "../../../server/security/routeSecurity";
import {
  badRequest,
  handleRouteError,
  ok,
  serverError,
} from "../../../server/utils/apiResponse";
import {
  sanitizeUserString,
  validateCartItems,
  validateMinecraftUsername,
} from "../../../server/utils/validation";

type CreatePreferenceBody = {
  productName?: string;
  username?: string;
  items?: CartItem[];
};

const DEFAULT_MERCADOPAGO_CURRENCY_ID = "UYU";
const DEFAULT_UYU_PER_USD = 40;

function parsePositiveNumber(value: string | undefined, fallback: number) {
  if (!value?.trim()) return fallback;

  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolveMercadoPagoPricing(totalUsd: number) {
  const currencyId = (
    process.env.MERCADOPAGO_CURRENCY_ID ?? DEFAULT_MERCADOPAGO_CURRENCY_ID
  )
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{3}$/.test(currencyId)) {
    return {
      ok: false as const,
      reason: "MERCADOPAGO_CURRENCY_ID must be a 3-letter currency code.",
    };
  }

  if (!Number.isFinite(totalUsd) || totalUsd <= 0) {
    return {
      ok: false as const,
      reason: "Mercado Pago order total must be greater than zero.",
    };
  }

  if (currencyId === "UYU") {
    const uyuPerUsd = parsePositiveNumber(
      process.env.MERCADOPAGO_UYU_PER_USD,
      DEFAULT_UYU_PER_USD,
    );

    if (uyuPerUsd === null) {
      return {
        ok: false as const,
        reason: "MERCADOPAGO_UYU_PER_USD must be a positive number.",
      };
    }

    return {
      ok: true as const,
      amount: Math.max(1, Math.round(totalUsd * uyuPerUsd)),
      currencyId,
    };
  }

  if (currencyId === "USD") {
    return {
      ok: true as const,
      amount: Number(totalUsd.toFixed(2)),
      currencyId,
    };
  }

  return {
    ok: false as const,
    reason: "Unsupported MERCADOPAGO_CURRENCY_ID. Use UYU for Mercado Pago Uruguay.",
  };
}

function resolveBaseUrl(request: Request) {
  const candidate = env.BASE_URL ?? new URL(request.url).origin;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false as const, reason: "BASE_URL must use http or https." };
    }
    return { ok: true as const, value: parsed };
  } catch {
    return { ok: false as const, reason: "BASE_URL must be an absolute URL." };
  }
}

function buildAbsoluteUrl(baseUrl: URL, path: string) {
  const url = new URL(path, baseUrl);
  if (!url.protocol.startsWith("http")) {
    return { ok: false as const, reason: `Invalid URL protocol for ${path}.` };
  }
  return { ok: true as const, value: url.toString() };
}

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

export async function POST(request: Request) {
  const { context, response } = await applyRouteSecurity(request, {
    requireTrustedOrigin: true,
    rateLimits: [
      {
        scope: "mercadopago.create-preference.ip",
        identifier: contextSafeIp(request),
        limit: 10,
        windowMs: 60_000,
        code: "RATE_LIMITED",
        message: "Too many checkout attempts. Try again shortly.",
      },
    ],
  });
  if (response) return response;

  try {
    if (!env.MERCADOPAGO_ACCESS_TOKEN) {
      return serverError(
        "MERCADOPAGO_NOT_CONFIGURED",
        "Mercado Pago no esta configurado. Falta el access token del servidor.",
        { request, requestId: context.requestId },
      );
    }

    const body = await readJsonBody<CreatePreferenceBody>(request, context, {
      maxBytes: 12 * 1024,
    });
    if (!body.ok) return body.response;

    const username = validateMinecraftUsername(body.value.username);
    if (!username.ok) {
      return badRequest("INVALID_USERNAME", username.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const validatedItems = validateCartItems(body.value.items);
    if (!validatedItems.ok) {
      return badRequest("INVALID_CART", validatedItems.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const productName =
      sanitizeUserString(body.value.productName, 120) || "BrotherSPvP Store Order";

    const cartFingerprint = hashIdentifier(
      JSON.stringify({
        provider: "mercadopago",
        username: username.value,
        items: validatedItems.value,
      }),
    );

    const duplicateCheckoutResponse = await enforceRateLimit(request, context, {
      scope: "checkout.duplicate",
      identifier: `${context.ipHash}:${cartFingerprint}`,
      limit: 1,
      windowMs: 20_000,
      code: "DUPLICATE_CHECKOUT",
      message: "Duplicate checkout attempt detected. Wait a few seconds before retrying.",
    });
    if (duplicateCheckoutResponse) return duplicateCheckoutResponse;

    const paymentCooldownResponse = await enforceRateLimit(request, context, {
      scope: "checkout.cooldown",
      identifier: `${context.ipHash}:mercadopago:${username.value}`,
      limit: 3,
      windowMs: 120_000,
      code: "PAYMENT_COOLDOWN",
      message: "Too many payment attempts for this account. Try again shortly.",
    });
    if (paymentCooldownResponse) return paymentCooldownResponse;

    const created = await createOrder({
      username: username.value,
      items: validatedItems.value,
      paymentMethod: "mercadopago",
      evidence: {
        clientIp: context.ip,
        clientIpHash: context.ipHash,
        userAgent: context.userAgent,
        checkoutRequestId: context.requestId,
      },
    });
    if (!created.ok) {
      return badRequest("INVALID_ITEMS", created.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const baseUrl = resolveBaseUrl(request);
    if (!baseUrl.ok) {
      return serverError("INVALID_BASE_URL", baseUrl.reason, {
        request,
        requestId: context.requestId,
      });
    }
    if (isLocalHostname(baseUrl.value.hostname)) {
      return badRequest(
        "INVALID_BASE_URL",
        "Mercado Pago Checkout Pro requires a public BASE_URL.",
        { request, requestId: context.requestId },
      );
    }

    const pricing = resolveMercadoPagoPricing(created.order.totalUsd);
    if (!pricing.ok) {
      return serverError("INVALID_MERCADOPAGO_PRICING", pricing.reason, {
        request,
        requestId: context.requestId,
      });
    }

    const amount = pricing.amount;
    const externalReference = created.order.id;

    const returnParams = new URLSearchParams({
      gateway: "mercadopago",
      external_reference: created.order.id,
      username: username.value,
      amount: created.order.totalUsd.toFixed(2),
    });
    const successUrl = buildAbsoluteUrl(baseUrl.value, `/checkout/success?${returnParams}`);
    const failureUrl = buildAbsoluteUrl(baseUrl.value, `/checkout/failure?${returnParams}`);
    const pendingUrl = buildAbsoluteUrl(baseUrl.value, `/checkout/pending?${returnParams}`);
    if (!successUrl.ok || !failureUrl.ok || !pendingUrl.ok) {
      return serverError("INVALID_BACK_URLS", "Failed to build checkout redirect URLs.", {
        request,
        requestId: context.requestId,
      });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
    const preferenceClient = new Preference(client);
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: externalReference,
            title: productName,
            quantity: 1,
            currency_id: pricing.currencyId,
            unit_price: amount,
          },
        ],
        external_reference: externalReference,
        back_urls: {
          success: successUrl.value,
          failure: failureUrl.value,
          pending: pendingUrl.value,
        },
        auto_return: "approved",
      },
    });

    const initPointUrl = preference.init_point?.trim() ?? "";
    if (!initPointUrl || !preference.id) {
      return serverError(
        "MERCADOPAGO_INVALID_RESPONSE",
        "Mercado Pago did not return a production init_point.",
        { request, requestId: context.requestId },
      );
    }

    await registerPaymentReference({
      provider: "mercadopago",
      paymentId: preference.id,
      orderId: created.order.id,
    });

    return ok(
      {
        preferenceId: preference.id,
        url: initPointUrl,
        orderId: created.order.id,
        currencyId: pricing.currencyId,
        amount,
      },
      {
        request,
        requestId: context.requestId,
      },
    );
  } catch (error) {
    return handleRouteError(error, {
      request,
      requestId: context.requestId,
      code: "MERCADOPAGO_CREATE_ERROR",
      publicMessage: "Could not create the Mercado Pago checkout.",
      logEvent: "mercadopago_create_preference_error",
    });
  }
}

function contextSafeIp(request: Request) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-vercel-forwarded-for")
    ?? request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}
