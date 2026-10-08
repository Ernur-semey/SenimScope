const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function hostnameOf(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value.includes("://") ? value : `http://${value}`).hostname.replace(/^\[|\]$/gu, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isLocalDemoRequest(request: Request) {
  const host = hostnameOf(request.headers.get("host"));
  if (!host || !localHosts.has(host)) return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;
  const originHost = hostnameOf(origin);
  return !!originHost && localHosts.has(originHost);
}
