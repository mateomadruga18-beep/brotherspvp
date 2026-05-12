import {
  hasValidDeliveryAgentToken,
  isDeliveryAgentConfigured,
} from "../../../../server/deliveryAgentAuth";
import {
  getDeliveryTask,
  markAgentTaskFailed,
  markTaskDelivered,
} from "../../../../server/repositories/deliveryRepository";
import { readJsonBody } from "../../../../server/security/body";
import { applyRouteSecurity } from "../../../../server/security/routeSecurity";
import {
  badRequest,
  forbidden,
  handleRouteError,
  notFound,
  ok,
  serverError,
} from "../../../../server/utils/apiResponse";

export const dynamic = "force-dynamic";

type ReportBody = {
  status?: string;
  message?: string;
};

function contextSafeIp(request: Request) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-vercel-forwarded-for")
    ?? request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}

function cleanMessage(value: unknown) {
  return typeof value === "string"
    ? value.normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 500)
    : "";
}

function isValidTaskId(value: string) {
  return value.length >= 6 && value.length <= 240 && /^[A-Za-z0-9_:.+-]+$/.test(value);
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ taskId: string }> },
) {
  const { context, response } = await applyRouteSecurity(request, {
    rateLimits: [
      {
        scope: "delivery-agent.report.ip",
        identifier: contextSafeIp(request),
        limit: 180,
        windowMs: 60_000,
        code: "RATE_LIMITED",
        message: "Too many delivery report requests.",
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

    const { taskId } = await ctx.params;
    if (!isValidTaskId(taskId)) {
      return badRequest("INVALID_TASK_ID", "Invalid delivery task id.", {
        request,
        requestId: context.requestId,
      });
    }

    const body = await readJsonBody<ReportBody>(request, context, {
      maxBytes: 4 * 1024,
    });
    if (!body.ok) return body.response;

    const status = body.value.status;
    const message = cleanMessage(body.value.message);

    const existing = await getDeliveryTask(taskId);
    if (!existing) {
      return notFound("DELIVERY_TASK_NOT_FOUND", "Delivery task not found.", {
        request,
        requestId: context.requestId,
      });
    }

    const updated = status === "delivered"
      ? await markTaskDelivered({
          taskId,
          message: message || "agent_delivery_success",
        })
      : status === "failed"
        ? await markAgentTaskFailed({
            taskId,
            error: message || "Agent reported delivery failure.",
            retryDelayMs: 30_000,
            maxAttempts: 5,
          })
        : null;

    if (!updated) {
      return badRequest("INVALID_DELIVERY_STATUS", "Status must be 'delivered' or 'failed'.", {
        request,
        requestId: context.requestId,
      });
    }

    return ok(
      {
        task: {
          id: updated.id,
          status: updated.status,
          retryCount: updated.retryCount,
          lastError: updated.lastError,
        },
      },
      { request, requestId: context.requestId },
    );
  } catch (error) {
    return handleRouteError(error, {
      request,
      requestId: context.requestId,
      code: "DELIVERY_AGENT_REPORT_ERROR",
      publicMessage: "Could not update delivery task.",
      logEvent: "delivery_agent_report_error",
    });
  }
}

