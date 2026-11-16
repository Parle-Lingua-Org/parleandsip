import { toUserMessage } from "@/lib/errors";

export function apiError(reason: unknown, status = 500, fallback?: string) {
  return Response.json({ error: toUserMessage(reason, fallback) }, { status });
}
