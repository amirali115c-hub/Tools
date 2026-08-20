const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

export async function fetchWithCORS(url: string): Promise<{html: string; statusCode: number; loadTime: number}> {
  const startTime = Date.now();

  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(15000),
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
