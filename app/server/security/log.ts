import "server-only";

type LogLevel = "info" | "warn" | "error";

const REDACTED = "[redacted]";
const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|password|secret|signature|token|private|cert|credential)/i;

function sanitizeKeyValue(key: string, value: unknown): unknown {
  if (value == null) return value;

  if (typeof value === "string") {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      return REDACTED;
    }

    const normalized = value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
    return normalized.length > 500 ? `${normalized.slice(0, 500)}...` : normalized;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === "production" ? undefined : value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((entry, index) => sanitizeKeyValue(`${key}[${index}]`, entry));
  }

  if (typeof value === "object") {
    const input = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(input).slice(0, 50).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeKeyValue(entryKey, entryValue),
      ]),
    );
  }

  return String(value);
}

export function securityLog(level: LogLevel, event: string, data: Record<string, unknown> = {}) {
  const payload = {
    at: new Date().toISOString(),
    event,
    ...Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, sanitizeKeyValue(key, value)]),
    ),
  };

  if (level === "error") {
    console.error("[security]", payload);
    return;
  }

  if (level === "warn") {
    console.warn("[security]", payload);
    return;
  }

  console.info("[security]", payload);
}
