import { address } from "@solana/kit";
import { isLocalDemoRequest } from "@/app/lib/local-demo-security";
import { issueWalletChallenge } from "@/app/lib/local-wallet-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Local demo auth is unavailable in production." }, { status: 404 });
  if (!isLocalDemoRequest(request)) return Response.json({ error: "Local demo endpoint only." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const walletAddress = body && typeof body === "object" ? (body as { walletAddress?: unknown }).walletAddress : undefined;
  if (typeof walletAddress !== "string" || walletAddress.length > 64) {
    return Response.json({ error: "A valid wallet address is required." }, { status: 400 });
  }

  try {
    const parsedAddress = address(walletAddress);
    const domain = request.headers.get("host") ?? "localhost";
    return Response.json(issueWalletChallenge(parsedAddress, domain), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Wallet address is not a valid Solana address." }, { status: 400 });
  }
}
