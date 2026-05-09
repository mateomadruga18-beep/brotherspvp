import "server-only";
import { isIP } from "node:net";

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

function parseBooleanFlag(value: string | undefined) {
  return /^(1|true|yes|on)$/i.test(value?.trim() ?? "");
}

function isPrivateIpv4(hostname: string) {
  const [a = "", b = ""] = hostname.split(".");
  const first = Number(a);
  const second = Number(b);

  if (!Number.isInteger(first) || !Number.isInteger(second)) {
    return false;
  }

  return (
    first === 10
    || first === 127
    || first === 0
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
  );
}

function isPrivateIpv6(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd")
    || normalized.startsWith("fe80:");
}

function isLocalHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return true;

  if (
    normalized === "localhost"
    || normalized === "0.0.0.0"
    || normalized === "::1"
    || normalized.endsWith(".local")
    || normalized.endsWith(".test")
    || normalized.endsWith(".internal")
  ) {
    return true;
  }

  if (!normalized.includes(".")) {
    return true;
  }

  const ipVersion = isIP(normalized);
  if (ipVersion === 4) return isPrivateIpv4(normalized);
  if (ipVersion === 6) return isPrivateIpv6(normalized);

  return false;
}

function isPublicDeploymentOrigin(origin: string | undefined) {
  if (!origin) return false;

  try {
    return !isLocalHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
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

function formatListGroup(title: string, entries: string[]) {
  if (entries.length === 0) return "";
  return `${title}:\n- ${entries.join("\n- ")}`;
}

function warnDevelopmentConfig(entries: string[]) {
  if (entries.length === 0) return;

  console.warn(
    [
      "Environment configuration warnings:",
      formatListGroup("Development missing config (non-blocking)", entries),
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

const blockingErrors: string[] = [];
const productionMissingConfig: string[] = [];
const developmentMissingConfig: string[] = [];
const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
const baseUrl = normalizeOrigin(process.env.BASE_URL, "BASE_URL", blockingErrors);
const publicBaseUrl = normalizeOrigin(
  process.env.NEXT_PUBLIC_BASE_URL,
  "NEXT_PUBLIC_BASE_URL",
  blockingErrors,
);
const paypalEnvironment = (process.env.PAYPAL_ENVIRONMENT ?? "sandbox").trim().toLowerCase();
const forceProductionValidation = parseBooleanFlag(process.env.FORCE_PRODUCTION_VALIDATION);
const isVercelProduction = (process.env.VERCEL_ENV ?? "").trim().toLowerCase() === "production";
const hasPublicBaseUrl = isPublicDeploymentOrigin(baseUrl) || isPublicDeploymentOrigin(publicBaseUrl);
const isNextProductionBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

/** During `next build`, env may be incomplete; validate again at runtime (serverless excludes this phase). */
const enforceProductionValidation =
  forceProductionValidation
  || (
    !isNextProductionBuildPhase
    && (isVercelProduction || (nodeEnv === "production" && hasPublicBaseUrl))
  );

validatePublicEnvExposure(blockingErrors);

if (paypalEnvironment !== "sandbox" && paypalEnvironment !== "live") {
  blockingErrors.push("PAYPAL_ENVIRONMENT must be either 'sandbox' or 'live'.");
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  blockingErrors.push("DATABASE_URL is required.");
}

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
  if (process.env[name]?.trim()) continue;

  if (enforceProductionValidation) {
    productionMissingConfig.push(`${name} is required in production.`);
  } else if (
    name === "PAYPAL_WEBHOOK_SECRET"
    || name === "MERCADOPAGO_WEBHOOK_SECRET"
    || name === "RCON_PASSWORD"
  ) {
    developmentMissingConfig.push(
      `${name} is not configured. Local development will continue, but that integration stays unavailable until you set it.`,
    );
  }
}

if (enforceProductionValidation && !(baseUrl || publicBaseUrl)) {
  productionMissingConfig.push("BASE_URL or NEXT_PUBLIC_BASE_URL is required in production.");
}

const rconPort = process.env.RCON_PORT?.trim();
if (rconPort && !/^\d+$/.test(rconPort)) {
  blockingErrors.push("RCON_PORT must be numeric.");
}

const trustedOrigins = parseTrustedOrigins(blockingErrors);
if (trustedOrigins.length === 0 && enforceProductionValidation) {
  productionMissingConfig.push("At least one trusted origin is required in production.");
}

if (!isNextProductionBuildPhase) {
  warnDevelopmentConfig(developmentMissingConfig);
}

if (blockingErrors.length > 0 || productionMissingConfig.length > 0) {
  throw new Error(
    [
      "Invalid environment configuration:",
      formatListGroup("Configuration errors (blocking)", blockingErrors),
      formatListGroup("Production missing config (blocking)", productionMissingConfig),
    ]
      .filter(Boolean)
      .join("\n"),
  );
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
