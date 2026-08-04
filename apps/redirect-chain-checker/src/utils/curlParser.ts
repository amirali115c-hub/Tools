import { Hop } from '../types';

export function parseCurlOutput(rawText: string, initialUrl: string = ''): Hop[] {
  if (!rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const hops: Hop[] = [];
  let currentHopHeaders: Record<string, string> = {};
  let currentStatusCode: number | undefined;
  let currentStatusText = '';
  let currentUrl = initialUrl.trim();
  let inBlock = false;

  const getRedirectType = (code?: number): Hop['redirectType'] => {
    if (!code) return 'Custom';
    switch (code) {
      case 200: return '200 OK';
      case 301: return '301 Permanent';
      case 302: return '302 Found';
      case 303: return '303 See Other';
      case 307: return '307 Temporary';
      case 308: return '308 Permanent';
      case 404: return '404 Not Found';
      case 500: case 502: case 503: return '500 Server Error';
      default: return 'Custom';
    }
  };

  const finalizeBlock = (nextUrlFromHeader?: string) => {
    if (!inBlock) return;

    // Determine the URL for this hop
    const hopUrl = currentUrl || (hops.length === 0 ? 'http://example.com' : 'Destination');

    // Add hop
    const hop: Hop = {
      id: `hop-curl-${hops.length + 1}-${Date.now()}`,
      stepNumber: hops.length + 1,
      url: hopUrl,
      statusCode: currentStatusCode,
      statusText: currentStatusText,
      redirectType: getRedirectType(currentStatusCode),
      headers: { ...currentHopHeaders },
    };
    hops.push(hop);

    // Update currentUrl for the next hop if Location header exists
    if (nextUrlFromHeader) {
      try {
        // Resolve relative URLs if base URL is valid
        if (hopUrl.startsWith('http://') || hopUrl.startsWith('https://')) {
          const resolved = new URL(nextUrlFromHeader, hopUrl).toString();
          currentUrl = resolved;
        } else {
          currentUrl = nextUrlFromHeader;
        }
      } catch {
        currentUrl = nextUrlFromHeader;
      }
    }

    // Reset block vars
    currentHopHeaders = {};
    currentStatusCode = undefined;
    currentStatusText = '';
    inBlock = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for HTTP status line e.g., "HTTP/1.1 301 Moved Permanently" or "HTTP/2 200"
    const httpMatch = line.match(/^HTTP\/[\d\.]+\s+(\d{3})(?:\s+(.*))?/i);

    if (httpMatch) {
      if (inBlock) {
        // Find location header from previous block if any
        const locHeader = Object.keys(currentHopHeaders).find(k => k.toLowerCase() === 'location');
        finalizeBlock(locHeader ? currentHopHeaders[locHeader] : undefined);
      }

      inBlock = true;
      currentStatusCode = parseInt(httpMatch[1], 10);
      currentStatusText = httpMatch[2] ? httpMatch[2].trim() : `Status ${httpMatch[1]}`;
      if (!currentUrl && initialUrl) {
        currentUrl = initialUrl;
      }
      continue;
    }

    if (inBlock && line) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.substring(0, colonIdx).trim();
        const value = line.substring(colonIdx + 1).trim();
        currentHopHeaders[key] = value;
      }
    }
  }

  // Finalize the last block
  if (inBlock) {
    const locHeader = Object.keys(currentHopHeaders).find(k => k.toLowerCase() === 'location');
    finalizeBlock(locHeader ? currentHopHeaders[locHeader] : undefined);
  }

  // If the last hop had a location header, add the target destination hop as the final endpoint!
  if (hops.length > 0) {
    const lastHop = hops[hops.length - 1];
    const locHeaderKey = lastHop.headers ? Object.keys(lastHop.headers).find(k => k.toLowerCase() === 'location') : undefined;
    if (locHeaderKey && lastHop.headers && lastHop.headers[locHeaderKey]) {
      const targetUrl = currentUrl; // updated in finalizeBlock
      if (targetUrl && targetUrl !== lastHop.url) {
        hops.push({
          id: `hop-curl-final-${Date.now()}`,
          stepNumber: hops.length + 1,
          url: targetUrl,
          statusCode: 200,
          statusText: 'OK',
          redirectType: '200 OK',
          note: 'Inferred final destination from Location header',
        });
      }
    }
  }

  // Fallback: If text didn't start with HTTP/ line, attempt line-by-line parsing of simple URL lists
  if (hops.length === 0 && rawText.trim()) {
    const urlLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith('http://') || l.startsWith('https://'));
    if (urlLines.length > 0) {
      urlLines.forEach((u, index) => {
        const isLast = index === urlLines.length - 1;
        hops.push({
          id: `hop-simple-${index + 1}`,
          stepNumber: index + 1,
          url: u,
          statusCode: isLast ? 200 : 301,
          statusText: isLast ? 'OK' : 'Moved Permanently',
          redirectType: isLast ? '200 OK' : '301 Permanent',
        });
      });
    }
  }

  return hops;
}
