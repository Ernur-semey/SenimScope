"use client";

import { useWalletSession } from "../lib/wallet-session-context";

function compactAddress(value: string) {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function WalletAuthControl() {
  const { connectedAddress, authenticatedAddress, isAuthenticated, isChecking, isBusy, error, signIn, signOut } = useWalletSession();

  return (
    <div className="auth-control">
      {isAuthenticated && authenticatedAddress
        ? <><span className="auth-indicator"><i/>Вошли · {compactAddress(authenticatedAddress)}</span><button className="auth-button" onClick={signOut} disabled={isBusy}>{isBusy ? "Выход…" : "Выйти"}</button></>
        : connectedAddress
          ? <button className="auth-button auth-button-primary" onClick={signIn} disabled={isBusy || isChecking}>{isBusy ? "Подпись…" : isChecking ? "Проверяю…" : "Войти подписью"}</button>
          : <span className="auth-hint">Подключите кошелёк</span>}
      {error && <span className="auth-error" role="alert">{error}</span>}
    </div>
  );
}
