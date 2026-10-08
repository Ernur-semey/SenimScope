import { address } from "@solana/kit";
import { isLocalDemoRequest } from "@/app/lib/local-demo-security";
import { verifyWalletChallenge } from "@/app/lib/local-wallet-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Local demo auth is unavailable in production." }, { status: 404 });
  if (!isLocalDemoRequest(request)) return Response.json({ error: "Local demo endpoint only." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 4_000) {
    return Response.json({ error: "Signature request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (typeof data.challengeId !== "string" || data.challengeId.length > 64 || typeof data.walletAddress !== "string" || data.walletAddress.length > 64 || typeof data.signatureBase64 !== "string" || data.signatureBase64.length > 128) {
    return Response.json({ error: "Challenge, wallet address, and signature are required." }, { status: 400 });
  }

  try {
    const walletAddress = address(data.walletAddress);
    const session = await verifyWalletChallenge({ challengeId: data.challengeId, walletAddress, signatureBase64: data.signatureBase64 });
    if (!session) return Response.json({ error: "Signature is invalid or the challenge expired." }, { status: 401 });

    const response = Response.json({ walletAddress: session.walletAddress, expiresAt: session.expiresAt });
    response.headers.append("Set-Cookie", `senimscope_session=${session.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return Response.json({ error: "Wallet address is not valid." }, { status: 400 });
  }
}
