import { isDemoProject } from "@/app/lib/project-types";
import { isLocalDemoRequest } from "@/app/lib/local-demo-security";
import { getWalletSessionForRequest } from "@/app/lib/local-wallet-auth";
import { loadProject, saveProject } from "@/app/lib/local-project-store";

export const runtime = "nodejs";

function demoOnly() {
  return process.env.NODE_ENV === "production"
    ? Response.json({ error: "Local demo storage is only available during development." }, { status: 404 })
    : null;
}

export async function GET(request: Request) {
  const unavailable = demoOnly();
  if (unavailable) return unavailable;
  if (!isLocalDemoRequest(request)) return Response.json({ error: "Local demo endpoint only." }, { status: 403 });

  try {
    return Response.json(await loadProject(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not load the local demo project." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const unavailable = demoOnly();
  if (unavailable) return unavailable;
  if (!isLocalDemoRequest(request)) return Response.json({ error: "Local demo endpoint only." }, { status: 403 });
  if (!getWalletSessionForRequest(request)) return Response.json({ error: "Sign in with the connected wallet before changing the local project." }, { status: 401 });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_000) {
    return Response.json({ error: "Project update is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isDemoProject(body)) {
    return Response.json({ error: "Project data did not match the demo schema." }, { status: 400 });
  }

  const project = { ...body, updatedAt: new Date().toISOString() };
  try {
    await saveProject(project);
    return Response.json(project, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not save the local demo project." }, { status: 500 });
  }
}
