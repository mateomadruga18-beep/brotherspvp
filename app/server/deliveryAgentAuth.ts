import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "./env";

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function bearerToken(value: string | null) {
  if (!value) return null;
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match?.[1]?.trim() ?? null;
}

export function isDeliveryAgentConfigured() {
  return env.DELIVERY_MODE === "agent" && Boolean(env.DELIVERY_AGENT_TOKEN);
}

export function hasValidDeliveryAgentToken(request: Request) {
  if (!isDeliveryAgentConfigured() || !env.DELIVERY_AGENT_TOKEN) return false;

  const token =
    bearerToken(request.headers.get("authorization"))
    ?? request.headers.get("x-delivery-agent-token")?.trim()
    ?? "";

  return constantTimeEqual(token, env.DELIVERY_AGENT_TOKEN);
}

