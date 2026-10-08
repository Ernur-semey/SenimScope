import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { address, assertIsSignatureBytes, getPublicKeyFromAddress, verifySignature } from "@solana/kit";

const CHALLENGE_TTL_MS = 5 * 60 * 1_000;
const SESSION_TTL_MS = 8 * 60 * 60 * 1_000;
const challenges = new Map<string, { walletAddress: string; message: string; expiresAt: number }>();
const sessions = new Map<string, { walletAddress: string; expiresAt: number }>();

function removeExpiredEntries(now = Date.now()) {
  for (const [id, value] of challenges) if (value.expiresAt <= now) challenges.delete(id);
  for (const [token, value] of sessions) if (value.expiresAt <= now) sessions.delete(token);
}

export function issueWalletChallenge(walletAddress: string, domain: string) {
  removeExpiredEntries();
  const id = randomUUID();
  const issuedAt = new Date().toISOString();
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  const message = [
    "SenimScope локальная авторизация",
    `Домен: ${domain}`,
    `Кошелёк: ${walletAddress}`,
    "Действие: подтвердить владение адресом для локальной демо-сессии.",
    `Nonce: ${randomBytes(24).toString("hex")}`,
    `Выпущено: ${issuedAt}`,
    `Действительно до: ${new Date(expiresAt).toISOString()}`,
    "Подпись не является согласием на транзакцию или перевод средств.",
  ].join("\n");

  challenges.set(id, { walletAddress, message, expiresAt });
  return { challengeId: id, message, expiresAt: new Date(expiresAt).toISOString() };
}

export async function verifyWalletChallenge(input: {
  challengeId: string;
  walletAddress: string;
  signatureBase64: string;
}) {
  removeExpiredEntries();
  const challenge = challenges.get(input.challengeId);
  challenges.delete(input.challengeId);
  if (!challenge || challenge.expiresAt <= Date.now() || challenge.walletAddress !== input.walletAddress) return null;
  if (!/^[A-Za-z0-9+/]+={0,2}$/u.test(input.signatureBase64)) return null;

  const signature = Buffer.from(input.signatureBase64, "base64");
  if (signature.length !== 64 || signature.toString("base64") !== input.signatureBase64) return null;

  try {
    const signatureBytes = Uint8Array.from(signature);
    assertIsSignatureBytes(signatureBytes);
    const publicKey = await getPublicKeyFromAddress(address(input.walletAddress));
    const valid = await verifySignature(publicKey, signatureBytes, new TextEncoder().encode(challenge.message));
    if (!valid) return null;
  } catch {
    return null;
  }

  removeExpiredEntries();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, { walletAddress: input.walletAddress, expiresAt });
  return { token, walletAddress: input.walletAddress, expiresAt: new Date(expiresAt).toISOString() };
}

export function getWalletSession(token: string | null) {
  if (!token) return null;
  removeExpiredEntries();
  return sessions.get(token) ?? null;
}

export function getWalletSessionTokenFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const pair = cookieHeader.split(";").map((item) => item.trim()).find((item) => item.startsWith("senimscope_session="));
  return pair?.slice("senimscope_session=".length) ?? null;
}

export function getWalletSessionForRequest(request: Request) {
  return getWalletSession(getWalletSessionTokenFromRequest(request));
}

export function revokeWalletSession(token: string | null) {
  if (token) sessions.delete(token);
}
