let patched = false;

/**
 * Patches global fetch to proxy external API calls through our server to avoid CORS issues.
 * Call this once during app initialization (client-side only). Safe to call multiple times.
 */
export function patchFetchForCors(): void {
  if (typeof window === "undefined" || patched) return;
  patched = true;

  const originalFetch = window.fetch;
  window.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    if (url.includes("mempool.space")) {
      const proxiedUrl = url.replace("https://mempool.space", "/api/mempool");
      return originalFetch(proxiedUrl, init);
    }
    if (url.includes("okx.com")) {
      const proxiedUrl = url.replace("https://www.okx.com", "/api/okx");
      return originalFetch(proxiedUrl, init);
    }
    return originalFetch(input, init);
  };
}
