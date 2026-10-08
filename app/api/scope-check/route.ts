import { assessScopeChange } from "@/app/lib/scope-analysis";
import { isLocalDemoRequest } from "@/app/lib/local-demo-security";
import type { ScopeItem } from "@/app/lib/project-types";

export const runtime = "nodejs";

type ScopeCheckPayload = {
  message: string;
  scopeItems: ScopeItem[];
};

function isScopeCheckPayload(value: unknown): value is ScopeCheckPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<ScopeCheckPayload>;
  return typeof payload.message === "string"
    && payload.message.trim().length > 0
    && payload.message.length <= 1_000
    && Array.isArray(payload.scopeItems)
    && payload.scopeItems.length <= 40
    && payload.scopeItems.every((item) => !!item && typeof item.id === "string" && item.id.length <= 100 && typeof item.title === "string" && item.title.length <= 200 && typeof item.description === "string" && item.description.length <= 500);
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "production" && !isLocalDemoRequest(request)) {
    return Response.json({ error: "Local demo endpoint only." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_000) {
    return Response.json({ error: "Scope check request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isScopeCheckPayload(body)) {
    return Response.json({ error: "Provide a message and a list of scope items." }, { status: 400 });
  }

  return Response.json(assessScopeChange(body.message, body.scopeItems), {
    headers: { "Cache-Control": "no-store" },
  });
}
