import { Hop, AuditFlag, ChainAnalysis, RedirectMode } from '../types';

export function analyzeChain(
  hops: Hop[],
  mode: RedirectMode,
  title: string = 'Redirect Chain Analysis',
  canonicalTarget?: string,
  rawCurlInput?: string
): ChainAnalysis {
  const flags: AuditFlag[] = [];
  const totalHops = hops.length;
  const totalRedirects = Math.max(0, totalHops - 1);
  const startingUrl = hops[0]?.url || '';
  const finalHop = hops[totalHops - 1];
  const finalUrl = finalHop?.url || '';

  let hasLoop = false;
  let hasDowngrade = false;
  let hasMixedTypes = false;
  let endsInError = false;
  let endsInRedirect = false;
  let opaqueDetected = hops.some(h => h.isOpaque);

  // Helper to normalize URL for loop check
  const normalizeUrl = (u: string) => {
    try {
      const parsed = new URL(u);
      return (parsed.hostname + parsed.pathname + parsed.search).toLowerCase().replace(/\/$/, '');
    } catch {
      return u.toLowerCase().replace(/\/$/, '');
    }
  };

  // 1. Check for Redirect Loops
  const visitedUrls = new Map<string, number>();
  hops.forEach((hop, idx) => {
    const norm = normalizeUrl(hop.url);
    if (visitedUrls.has(norm)) {
      hasLoop = true;
      const prevIdx = visitedUrls.get(norm)! + 1;
      flags.push({
        id: `loop-${idx}`,
        severity: 'critical',
        title: 'Redirect Loop Detected',
        description: `URL at hop #${idx + 1} (${hop.url}) was already visited at hop #${prevIdx}. Browsers and crawlers will break with ERR_TOO_MANY_REDIRECTS.`,
        recommendation: 'Break the infinite loop by updating server redirect configuration or removing cyclic rewrite rules immediately.',
        category: 'architecture',
      });
    } else {
      visitedUrls.set(norm, idx);
    }
  });

  // 2. Check Protocol Changes (HTTPS -> HTTP vs HTTP -> HTTPS)
  for (let i = 0; i < totalHops - 1; i++) {
    const currentUrl = hops[i].url;
    const nextUrl = hops[i + 1].url;

    const currentIsHttps = currentUrl.toLowerCase().startsWith('https://');
    const nextIsHttps = nextUrl.toLowerCase().startsWith('https://');

    if (currentIsHttps && !nextIsHttps) {
      hasDowngrade = true;
      flags.push({
        id: `downgrade-${i}`,
        severity: 'critical',
        title: 'Security Red Flag: Protocol Downgrade (HTTPS to HTTP)',
        description: `Hop #${i + 1} (${currentUrl}) redirects from encrypted HTTPS to unencrypted HTTP (${nextUrl}). This exposes user traffic and authorization cookies to man-in-the-middle attacks.`,
        recommendation: 'Enforce HTTPS across all hops. Ensure all internal redirects point directly to secure https:// endpoints.',
        category: 'security',
      });
    } else if (!currentIsHttps && nextIsHttps) {
      flags.push({
        id: `upgrade-${i}`,
        severity: 'success',
        title: 'Protocol Upgrade (HTTP to HTTPS)',
        description: `Hop #${i + 1} upgrades unencrypted HTTP traffic to secure HTTPS. This is recommended SEO and security practice.`,
        recommendation: 'Good job! Consider updating incoming backlinks or internal links directly to the HTTPS version to skip this hop.',
        category: 'security',
      });
    }
  }

  // 3. Check for Mixed Redirect Types (301 vs 302/307)
  const redirectStatusCodes = hops
    .slice(0, totalHops - 1)
    .map(h => h.statusCode)
    .filter((code): code is number => typeof code === 'number');

  const has301Or308 = redirectStatusCodes.some(c => c === 301 || c === 308);
  const has302Or307 = redirectStatusCodes.some(c => c === 302 || c === 303 || c === 307);

  if (has301Or308 && has302Or307) {
    hasMixedTypes = true;
    flags.push({
      id: 'mixed-redirect-types',
      severity: 'warning',
      title: 'Inconsistent Redirect Types (Mixed Permanent & Temporary)',
      description: 'This chain combines Permanent redirects (301/308) with Temporary redirects (302/307). Mixing permanent and temporary signals confuses search engines regarding indexing authority and canonical URL caching.',
      recommendation: 'Unify redirect status codes. Use 301/308 for permanent canonical changes or 302/307 for temporary campaigns across all intermediate hops.',
      category: 'seo',
    });
  }

  // 4. Check Chain Length
  if (totalRedirects === 1) {
    flags.push({
      id: 'chain-length-1',
      severity: 'success',
      title: 'Optimal Redirect (Single Hop)',
      description: 'The chain resolves in 1 redirect hop. This is the cleanest redirect setup.',
      recommendation: 'Ideal configuration! Ensure internal site links point directly to the destination URL where possible.',
      category: 'performance',
    });
  } else if (totalRedirects === 2) {
    flags.push({
      id: 'chain-length-2',
      severity: 'warning',
      title: '2-Hop Redirect Chain Detected',
      description: 'This URL goes through 2 intermediate redirect hops before reaching its destination. While functional, each hop adds ~50-150ms latency.',
      recommendation: 'Consolidate the initial redirect to point directly to the final destination URL.',
      category: 'performance',
    });
  } else if (totalRedirects >= 3) {
    flags.push({
      id: 'chain-length-multi',
      severity: 'warning',
      title: `Excessive Chain Length (${totalRedirects} Redirect Hops)`,
      description: `This chain has ${totalRedirects} redirect hops. Search engines (like Google) limit redirect following to ~3-5 hops before abandoning crawl, diluting link equity (PageRank) and increasing mobile page load delay.`,
      recommendation: 'Shorten the chain! Change the first URL to redirect directly to the final destination URL (1 hop).',
      category: 'performance',
    });
  }

  // 5. Check Terminal Status (Ends in 4xx/5xx or Unresolved 3xx)
  if (finalHop) {
    const finalCode = finalHop.statusCode;
    if (finalCode && finalCode >= 400 && finalCode <= 599) {
      endsInError = true;
      flags.push({
        id: 'terminal-error',
        severity: 'critical',
        title: `Redirect to Broken Destination (${finalCode} ${finalHop.statusText || 'Error'})`,
        description: `The chain leads to a dead-end HTTP ${finalCode} status code at ${finalUrl}. Users and search engines encounter a broken landing page.`,
        recommendation: 'Fix the final destination URL or update the redirect source to point to an active, valid HTTP 200 page.',
        category: 'architecture',
      });
    } else if (finalCode && finalCode >= 300 && finalCode <= 399) {
      endsInRedirect = true;
      flags.push({
        id: 'terminal-redirect',
        severity: 'critical',
        title: 'Unresolved Redirect Chain (Ends in 3xx Redirect)',
        description: `The last recorded hop (${finalUrl}) returned HTTP ${finalCode}, meaning the chain did not actually resolve to a 200 OK destination.`,
        recommendation: 'Provide or follow the final target URL until an HTTP 200 OK response is reached.',
        category: 'architecture',
      });
    }
  }

  // 6. Check www / non-www swaps and trailing slash changes
  for (let i = 0; i < totalHops - 1; i++) {
    try {
      const urlA = new URL(hops[i].url);
      const urlB = new URL(hops[i + 1].url);

      const hostA = urlA.hostname.toLowerCase();
      const hostB = urlB.hostname.toLowerCase();

      const isWwwA = hostA.startsWith('www.');
      const isWwwB = hostB.startsWith('www.');

      if (isWwwA !== isWwwB && hostA.replace(/^www\./, '') === hostB.replace(/^www\./, '')) {
        flags.push({
          id: `www-swap-${i}`,
          severity: 'info',
          title: 'www vs. Non-www Domain Swap',
          description: `Hop #${i + 1} switches between ${isWwwA ? 'www' : 'non-www'} (${hostA}) and ${isWwwB ? 'www' : 'non-www'} (${hostB}).`,
          recommendation: 'Ensure your site settings favor one consistent domain variant to prevent dual-indexing issues.',
          category: 'seo',
        });
      }

      const pathA = urlA.pathname;
      const pathB = urlB.pathname;
      if (
        (pathA + '/ === pathB' || pathA === pathB + '/') &&
        pathA !== pathB
      ) {
        flags.push({
          id: `trailing-slash-${i}`,
          severity: 'info',
          title: 'Trailing Slash Variation',
          description: `Hop #${i + 1} modifies trailing slash format (${pathA} ➔ ${pathB}).`,
          recommendation: 'Consolidate URL structures in internal navigation so links always include or omit trailing slashes consistently.',
          category: 'seo',
        });
      }
    } catch {
      // Ignore URL parsing errors for non-standard string formats
    }
  }

  // 7. Check Canonical Target Match (if user provided one)
  let matchesCanonical: boolean | undefined = undefined;
  if (canonicalTarget && canonicalTarget.trim()) {
    try {
      const targetNorm = normalizeUrl(canonicalTarget.trim());
      const finalNorm = normalizeUrl(finalUrl);
      matchesCanonical = targetNorm === finalNorm;

      if (!matchesCanonical) {
        flags.push({
          id: 'canonical-mismatch',
          severity: 'warning',
          title: 'Canonical Target Mismatch',
          description: `The final destination (${finalUrl}) does not match your specified canonical URL target (${canonicalTarget}).`,
          recommendation: `Update the redirect target to match your preferred canonical URL: ${canonicalTarget}`,
          category: 'seo',
        });
      } else {
        flags.push({
          id: 'canonical-match',
          severity: 'success',
          title: 'Matches Specified Canonical Target',
          description: 'The final destination perfectly matches your expected canonical domain format.',
          recommendation: 'Destination matches canonical policy.',
          category: 'seo',
        });
      }
    } catch {
      // ignore
    }
  }

  // 8. Opaque warning banner note if mode is automated and opaque response was returned
  if (opaqueDetected && mode === 'automated') {
    flags.push({
      id: 'opaque-notice',
      severity: 'warning',
      title: 'Opaque Redirect Detected (CORS Security Restricted)',
      description: 'The browser completed a cross-origin redirect via fetch(), but status codes and intermediate headers were masked by browser security (CORS). Total chain count or destination status was inferred.',
      recommendation: 'To view exact status codes and location headers for cross-origin URLs, switch to the "Curl Header Paste" mode and paste output from `curl -IL <url>`!',
      category: 'architecture',
    });
  }

  // Calculate total time if hop timing is present
  const totalTimeMs = hops.reduce((acc, h) => acc + (h.responseTimeMs || 0), 0);

  return {
    id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    createdAt: new Date().toISOString(),
    startingUrl,
    finalUrl,
    hops,
    totalHops,
    totalRedirects,
    totalTimeMs: totalTimeMs > 0 ? totalTimeMs : undefined,
    mode,
    flags,
    canonicalTarget,
    matchesCanonical,
    hasLoop,
    hasDowngrade,
    hasMixedTypes,
    endsInError,
    endsInRedirect,
    opaqueDetected,
    rawCurlInput,
  };
}
