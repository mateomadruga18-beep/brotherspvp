import { prisma } from "../db/prisma";

export async function incrementRateLimitBucket(params: {
  scope: string;
  identifier: string;
  windowMs: number;
}) {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / params.windowMs) * params.windowMs);
  const resetAt = new Date(windowStart.getTime() + params.windowMs);

  const row = await prisma.rateLimitBucket.upsert({
    where: {
      scope_identifier_windowStart: {
        scope: params.scope,
        identifier: params.identifier,
        windowStart,
      },
    },
    create: {
      scope: params.scope,
      identifier: params.identifier,
      windowStart,
      resetAt,
      hits: 1,
    },
    update: {
      hits: {
        increment: 1,
      },
      resetAt,
    },
  });

  return {
    hits: row.hits,
    resetAt: row.resetAt,
  };
}
