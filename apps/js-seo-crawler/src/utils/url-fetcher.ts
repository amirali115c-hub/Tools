const CORS_PROXIES = [
  // Custom Cloudflare Worker proxy (primary - no rate limits)
  (url: string) => `https://proxy.tools.clienvora.com/?url=${encodeURIComponent(url)}`,
  // Free fallback proxies (if custom proxy is down)
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

export async function fetchWithCORS(url: string): Promise<{html: string; statusCode: number; loadTime: number}> {
  const startTime = Date.now();

  for (const proxyFn of CORS_PROXIES) {
    const proxyUrl = proxyFn(url);
    try {
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(20000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ClienvoraBot/1.0)',
        },
      });

      if (response.ok) {
        const html = await response.text();
        return {
          html,
          statusCode: response.status,
          loadTime: Date.now() - startTime,
        };
      }
    } catch {
      continue;
    }
  }

  throw new Error('Unable to fetch URL. The site may block CORS requests or be unavailable.');
}

export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  return normalized;
}

export function getBaseUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return url;
  }
}

export function isSameDomain(url: string, baseUrl: string): boolean {
  try {
    const urlHost = new URL(url).hostname;
    const baseHost = new URL(baseUrl).hostname;
    return urlHost === baseHost;
  } catch {
    return false;
  }
}
