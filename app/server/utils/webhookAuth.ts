import { createHmac, timingSafeEqual } from "node:crypto";

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function hasValidWebhookSecret(params: {
  expected?: string;
  headerValue: string | null;
  queryValue?: string | null;
}) {
  if (!params.expected) return true;
  const headerCandidate = params.headerValue?.trim() ?? "";
  const queryCandidate = params.queryValue?.trim() ?? "";
  return (
    constantTimeEqual(headerCandidate, params.expected) ||
    constantTimeEqual(queryCandidate, params.expected)
  );
}

function parseMercadoPagoSignature(headerValue: string | null) {
  if (!headerValue) return null;

  const parsed = Object.fromEntries(
    headerValue.split(",").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key?.trim(), value?.trim()];
    }),
  );

  const ts = parsed.ts;
  const v1 = parsed.v1;
  if (!ts || !v1) {
    return null;
  }

  return {
    ts,
    v1,
  };
}

export function hasFreshWebhookTimestamp(rawTimestamp: string | null | undefined, toleranceMs: number) {
  if (!rawTimestamp) return false;

  const numericTimestamp = Number(rawTimestamp);
  const epochMs = Number.isFinite(numericTimestamp)
    ? numericTimestamp > 1_000_000_000_000
      ? numericTimestamp
      : numericTimestamp * 1000
    : Date.parse(rawTimestamp);

  if (!Number.isFinite(epochMs)) {
    return false;
  }

  return Math.abs(Date.now() - epochMs) <= toleranceMs;
}

export function hasValidMercadoPagoSignature(params: {
  secret?: string;
  signatureHeader: string | null;
  requestId: string | null;
  requestUrl: URL;
}) {
  if (!params.secret) return true;

  const signature = parseMercadoPagoSignature(params.signatureHeader);
  if (!signature || !hasFreshWebhookTimestamp(signature.ts, 5 * 60_000)) {
    return false;
  }

  const dataId = params.requestUrl.searchParams.get("data.id")?.toLowerCase() ?? "";
  const manifestParts = [
    dataId ? `id:${dataId};` : "",
    params.requestId ? `request-id:${params.requestId};` : "",
    `ts:${signature.ts};`,
  ].filter(Boolean);
  const manifest = manifestParts.join("");
  const expected = createHmac("sha256", params.secret).update(manifest).digest("hex");
  return constantTimeEqual(expected, signature.v1);
}
