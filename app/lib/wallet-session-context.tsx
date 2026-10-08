"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useConnectedWallet, useSignMessage } from "@solana/kit-plugin-wallet/react";
import { useAppClient } from "./client-provider";

type WalletSession = { walletAddress: string; expiresAt: string };
type WalletSessionContextValue = {
  connectedAddress: string | null;
  authenticatedAddress: string | null;
  isAuthenticated: boolean;
  isChecking: boolean;
  isBusy: boolean;
  error: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const WalletSessionContext = createContext<WalletSessionContextValue | null>(null);
const isPublicPreview = process.env.NODE_ENV === "production";

export function WalletSessionProvider({ children }: PropsWithChildren) {
  const client = useAppClient();
  const connectedWallet = useConnectedWallet(client);
  const { dispatchAsync: signMessage } = useSignMessage(client);
  const connectedAddress = connectedWallet?.account.address ?? null;
  const [session, setSession] = useState<WalletSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const authenticatedAddress = session?.walletAddress === connectedAddress ? session.walletAddress : null;

  useEffect(() => {
    let active = true;
    if (isPublicPreview) {
      setSession(null);
      setIsChecking(false);
      return () => { active = false; };
    }

    setIsChecking(true);
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Не удалось проверить локальную сессию.");
        return await response.json() as { authenticated: boolean; walletAddress?: string; expiresAt?: string };
      })
      .then((result) => {
        if (!active) return;
        setSession(result.authenticated && result.walletAddress && result.expiresAt ? { walletAddress: result.walletAddress, expiresAt: result.expiresAt } : null);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setIsChecking(false);
      });
    return () => { active = false; };
  }, [connectedAddress]);

  const signIn = useCallback(async () => {
    if (!connectedAddress) {
      setError("Сначала подключите кошелёк Solana.");
      return;
    }
    setIsBusy(true);
    setError("");
    try {
      const challengeResponse = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: connectedAddress }),
      });
      const challengeBody = await challengeResponse.json() as { challengeId?: string; message?: string; error?: string };
      if (!challengeResponse.ok || !challengeBody.challengeId || !challengeBody.message) throw new Error(challengeBody.error ?? "Не удалось получить challenge.");

      const signature = await signMessage(new TextEncoder().encode(challengeBody.message));
      const signatureBase64 = btoa(Array.from(signature, (byte) => String.fromCharCode(byte)).join(""));
      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challengeBody.challengeId, walletAddress: connectedAddress, signatureBase64 }),
      });
      const verifyBody = await verifyResponse.json() as { walletAddress?: string; expiresAt?: string; error?: string };
      if (!verifyResponse.ok || !verifyBody.walletAddress || !verifyBody.expiresAt) throw new Error(verifyBody.error ?? "Подпись не прошла проверку.");
      setSession({ walletAddress: verifyBody.walletAddress, expiresAt: verifyBody.expiresAt });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Авторизация кошельком не удалась.");
    } finally {
      setIsBusy(false);
    }
  }, [connectedAddress, signMessage]);

  const signOut = useCallback(async () => {
    setIsBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/session", { method: "DELETE" });
      if (!response.ok) throw new Error("Не удалось завершить локальную сессию.");
      setSession(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось выйти.");
    } finally {
      setIsBusy(false);
    }
  }, []);

  const value = useMemo<WalletSessionContextValue>(() => ({
    connectedAddress,
    authenticatedAddress,
    isAuthenticated: !!authenticatedAddress,
    isChecking,
    isBusy,
    error,
    signIn,
    signOut,
  }), [connectedAddress, authenticatedAddress, isChecking, isBusy, error, signIn, signOut]);

  return <WalletSessionContext.Provider value={value}>{children}</WalletSessionContext.Provider>;
}

export function useWalletSession() {
  const value = useContext(WalletSessionContext);
  if (!value) throw new Error("useWalletSession must be used inside WalletSessionProvider");
  return value;
}
