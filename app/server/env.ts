import "server-only";

type NodeEnv = "development" | "production" | "test";
type PayPalEnvironment = "sandbox" | "live";

type StoreEnv = {
  NODE_ENV: NodeEnv;
  DATABASE_URL: string;
  BASE_URL?: string;
  PAYPAL_ENVIRONMENT: PayPalEnvironment;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_WEBHOOK_SECRET?: string;
  MERCADOPAGO_ACCESS_TOKEN?: string;
  MERCADOPAGO_WEBHOOK_SECRET?: string;
  MERCADOPAGO_PUBLIC_KEY?: string;
  RCON_HOST?: string;
  RCON_PORT?: string;
  RCON_PASSWORD?: string;
  trustedOrigins: string[];
};

function parseNodeEnv(value: string | undefined): NodeEnv {
  if (value === "production" || value === "test") {
    return value;
  }
  return "development";
}

function normalizeOrigin(value: string | undefined, field: string, errors: string[]) {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    errors.push(`${field} must be a valid absolute URL.`);
    return undefined;
  }
}

function parseTrustedOrigins(errors: string[]) {
  const raw = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.BASE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ...(process.env.TRUSTED_ORIGINS?.split(",") ?? []),
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return Array.from(
    new Set(
      raw.flatMap((entry) => {
        if (entry.includes("*.")) {
          try {
            const parsed = new URL(entry.replace("*.", ""));
            return [`${parsed.protocol}//*.${parsed.hostname}`];
          } catch {
            errors.push(`TRUSTED_ORIGINS contains an invalid wildcard origin: ${entry}`);
            return [];
          }
        }

        const normalized = normalizeOrigin(entry, "TRUSTED_ORIGINS", errors);
        return normalized ? [normalized] : [];
      }),
    ),
  );
}

function validatePublicEnvExposure(errors: string[]) {
  const publicAllowList = new Set([
    "NEXT_PUBLIC_BASE_URL",
    "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY",
    "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  ]);

  for (const key of Object.keys(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    if (publicAllowList.has(key)) continue;
    if (/(SECRET|TOKEN|PASSWORD|PRIVATE|DATABASE|RCON|ACCESS)/i.test(key)) {
      errors.push(`${key} must not be exposed with a NEXT_PUBLIC_ prefix.`);
    }
  }
}

const errors: string[] = [];
const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
const baseUrl = normalizeOrigin(process.env.BASE_URL, "BASE_URL", errors);
const publicBaseUrl = normalizeOrigin(process.env.NEXT_PUBLIC_BASE_URL, "NEXT_PUBLIC_BASE_URL", errors);
const paypalEnvironment = (process.env.PAYPAL_ENVIRONMENT ?? "sandbox").trim().toLowerCase();

validatePublicEnvExposure(errors);

if (paypalEnvironment !== "sandbox" && paypalEnvironment !== "live") {
  errors.push("PAYPAL_ENVIRONMENT must be either 'sandbox' or 'live'.");
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  errors.push("DATABASE_URL is required.");
}

if (nodeEnv === "production") {
  const requiredInProduction = [
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "PAYPAL_WEBHOOK_SECRET",
    "MERCADOPAGO_ACCESS_TOKEN",
    "MERCADOPAGO_WEBHOOK_SECRET",
    "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY",
    "RCON_HOST",
    "RCON_PORT",
    "RCON_PASSWORD",
  ] as const;

  for (const name of requiredInProduction) {
    if (!process.env[name]?.trim()) {
      errors.push(`${name} is required in production.`);
    }
  }

  if (!(baseUrl || publicBaseUrl)) {
    errors.push("BASE_URL or NEXT_PUBLIC_BASE_URL is required in production.");
  }
}

const rconPort = process.env.RCON_PORT?.trim();
if (rconPort && !/^\d+$/.test(rconPort)) {
  errors.push("RCON_PORT must be numeric.");
}

const trustedOrigins = parseTrustedOrigins(errors);
if (trustedOrigins.length === 0 && nodeEnv === "production") {
  errors.push("At least one trusted origin is required in production.");
}

if (errors.length > 0) {
  throw new Error(`Invalid environment configuration:\n- ${errors.join("\n- ")}`);
}

export const env: StoreEnv = {
  NODE_ENV: nodeEnv,
  DATABASE_URL: databaseUrl ?? "",
  BASE_URL: baseUrl ?? publicBaseUrl,
  PAYPAL_ENVIRONMENT: paypalEnvironment as PayPalEnvironment,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID?.trim(),
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET?.trim(),
  PAYPAL_WEBHOOK_SECRET: process.env.PAYPAL_WEBHOOK_SECRET?.trim(),
  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN?.trim(),
  MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim(),
  MERCADOPAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim(),
  RCON_HOST: process.env.RCON_HOST?.trim(),
  RCON_PORT: rconPort,
  RCON_PASSWORD: process.env.RCON_PASSWORD?.trim(),
  trustedOrigins,
};
