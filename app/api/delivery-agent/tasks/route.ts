import { hasValidDeliveryAgentToken, isDeliveryAgentConfigured } from "../../../server/deliveryAgentAuth";
import { claimDuePendingTasksForAgent } from "../../../server/repositories/deliveryRepository";
import { applyRouteSecurity } from "../../../server/security/routeSecurity";
import {
  forbidden,
  handleRouteError,
  ok,
  serverError,
} from "../../../server/utils/apiResponse";

export const dynamic = "force-dynamic";

function contextSafeIp(request: Request) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-vercel-forwarded-for")
    ?? request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}

function parseLimit(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 25) : 10;
}

export async function GET(request: Request) {
  const { context, response } = await applyRouteSecurity(request, {
    rateLimits: [
      {
        scope: "delivery-agent.tasks.ip",
        identifier: contextSafeIp(request),
        limit: 120,
        windowMs: 60_000,
        code: "RATE_LIMITED",
        message: "Too many delivery agent requests.",
      },
    ],
  });
  if (response) return response;

  try {
    if (!isDeliveryAgentConfigured()) {
      return serverError("DELIVERY_AGENT_NOT_CONFIGURED", "Delivery agent is not configured.", {
        request,
        requestId: context.requestId,
      });
    }

    if (!hasValidDeliveryAgentToken(request)) {
      return forbidden("INVALID_DELIVERY_AGENT_TOKEN", "Invalid delivery agent token.", {
        request,
        requestId: context.requestId,
      });
    }

    const url = new URL(request.url);
    const tasks = await claimDuePendingTasksForAgent({
      limit: parseLimit(url.searchParams.get("limit")),
      leaseMs: 120_000,
      agentId: request.headers.get("x-delivery-agent-id") ?? undefined,
    });

    return ok(
      {
        tasks: tasks.map((task) => ({
          id: task.id,
          orderId: task.orderId,
          username: task.username,
          command: task.command,
          retryCount: task.retryCount,
        })),
      },
      { request, requestId: context.requestId },
    );
  } catch (error) {
    return handleRouteError(error, {
      request,
      requestId: context.requestId,
      code: "DELIVERY_AGENT_TASKS_ERROR",
      publicMessage: "Could not load delivery tasks.",
      logEvent: "delivery_agent_tasks_error",
    });
  }
}

