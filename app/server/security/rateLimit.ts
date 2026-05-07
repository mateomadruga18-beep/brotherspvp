import "server-only";
import { incrementRateLimitBucket } from "../repositories/rateLimitRepository";
import { securityLog } from "./log";
import type { RequestContext } from "./request";
import { tooManyRequests } from "../utils/apiResponse";

export type RateLimitRule = {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
  code: string;
  message: string;
};

export async function enforceRateLimit(
  request: Request,
  context: RequestContext,
  rule: RateLimitRule,
) {
  const result = await incrementRateLimitBucket({
    scope: rule.scope,
    identifier: rule.identifier,
    windowMs: rule.windowMs,
  });

  if (result.hits <= rule.limit) {
    return null;
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
  );

  securityLog("warn", "rate_limit_hit", {
    requestId: context.requestId,
    path: context.path,
    ipHash: context.ipHash,
    scope: rule.scope,
    limit: rule.limit,
    hits: result.hits,
    retryAfterSeconds,
  });

  return tooManyRequests(rule.code, rule.message, retryAfterSeconds, {
    request,
    requestId: context.requestId,
  });
}
