import { isLocalDemoRequest } from "@/app/lib/local-demo-security";
import { getWalletSessionForRequest, getWalletSessionTokenFromRequest, revokeWalletSession } from "@/app/lib/local-wallet-auth";

export const runtime = "nodejs";

function demoOnly() {
  return process.env.NODE_ENV === "production"
    ? Response.json({ error: "Local demo auth is unavailable in production." }, { status: 404 })
    : null;
}

export async function GET(request: Request) {
  const unavailable = demoOnly();
  if (unavailable) return unavailable;
  if (!isLocalDemoRequest(request)) return Response.json({ error: "Local demo endpoint only." }, { status: 403 });

  const session = getWalletSessionForRequest(request);
  if (!session) return Response.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
  return Response.json({ authenticated: true, walletAddress: session.walletAddress, expiresAt: new Date(session.expiresAt).toISOString() }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  const unavailable = demoOnly();
  if (unavailable) return unavailable;
  if (!isLocalDemoRequest(request)) return Response.json({ error: "Local demo endpoint only." }, { status: 403 });

  const session = getWalletSessionForRequest(request);
  if (session) revokeWalletSession(getWalletSessionTokenFromRequest(request));
  const response = Response.json({ authenticated: false });
  response.headers.append("Set-Cookie", "senimscope_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
