import {
  AuditIssue,
  HeaderSignal,
  PageAuditResult,
  ParsedPageData,
  BulkCluster,
  DuplicateTitleCluster,
} from '../types';

/**
 * Normalizes a URL string for consistent comparison
 */
export function normalizeUrl(urlStr: string, baseUrl?: string): string {
  if (!urlStr) return '';
  try {
    const resolved = baseUrl ? new URL(urlStr, baseUrl).href : new URL(urlStr).href;
    // Remove default ports and normalize trailing slashes if path is root
    const parsed = new URL(resolved);
    let pathname = parsed.pathname;
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`;
  } catch {
    return urlStr.trim().toLowerCase();
  }
}

/**
 * Parses raw HTTP response headers for Link: <url>; rel="canonical"
 */
export function parseHeaderCanonical(headersText: string): HeaderSignal | null {
  if (!headersText) return null;
  const lines = headersText.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^link:\s*<([^>]+)>;\s*rel=["']?canonical["']?/i);
    if (match) {
      return {
        hasCanonical: true,
        url: match[1],
        rawHeader: line.trim(),
      };
    }
  }
  return null;
}

/**
 * Extract URL tracking parameters
 */
export function getTrackingParams(urlStr: string): Record<string, string> {
  const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'sessionid', 'sid', 'gclid', 'fbclid', 'ref', 'mc_eid'];
  const found: Record<string, string> = {};
  try {
    const u = new URL(urlStr);
    u.searchParams.forEach((val, key) => {
      if (trackingKeys.includes(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        found[key] = val;
      }
    });
  } catch {
    // fallback
  }
  return found;
}

/**
 * Parses raw HTML string and context into structured data
 */
export function parsePageSource(html: string, pageUrl: string, headersText: string = ''): ParsedPageData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const title = doc.querySelector('title')?.textContent?.trim() || 'No Title Tag Found';
  const h1 = doc.querySelector('h1')?.textContent?.trim() || 'No H1 Tag Found';

  // 1. Head Canonical Tags
  const headCanonicalElements = Array.from(doc.head?.querySelectorAll('link[rel~="canonical"]') || []);
  const headCanonicalTags = headCanonicalElements.map((el) => ({
    href: el.getAttribute('href') || '',
    raw: el.outerHTML,
    location: 'head' as const,
  }));

  // 2. Body Canonical Tags (Placed outside head)
  const bodyCanonicalElements = Array.from(doc.body?.querySelectorAll('link[rel~="canonical"]') || []);
  const bodyCanonicalTags = bodyCanonicalElements.map((el) => ({
    href: el.getAttribute('href') || '',
    raw: el.outerHTML,
    location: 'body' as const,
  }));

  // 3. Header Canonical Signal
  const headerCanonical = parseHeaderCanonical(headersText);

  // 4. Meta Robots
  const metaRobotsElements = Array.from(doc.querySelectorAll('meta[name="robots" i]'));
  const metaRobots = metaRobotsElements
    .map((el) => el.getAttribute('content')?.toLowerCase() || '')
    .filter(Boolean);

  if (headersText.toLowerCase().includes('x-robots-tag')) {
    const lines = headersText.split(/\r?\n/);
    for (const line of lines) {
      if (line.toLowerCase().startsWith('x-robots-tag:')) {
        metaRobots.push(line.split(':')[1].trim().toLowerCase());
      }
    }
  }

  // 5. hreflang tags
  const hreflangEls = Array.from(doc.querySelectorAll('link[rel~="alternate"][hreflang]'));
  const hreflangTags = hreflangEls.map((el) => ({
    lang: el.getAttribute('hreflang') || '',
    href: el.getAttribute('href') || '',
    raw: el.outerHTML,
  }));

  // 6. Pagination signals
  const relNext = doc.querySelector('link[rel~="next"]')?.getAttribute('href') || null;
  const relPrev = doc.querySelector('link[rel~="prev"]')?.getAttribute('href') || null;
  
  let pageParam: number | null = null;
  try {
    const u = new URL(pageUrl);
    const p = u.searchParams.get('page') || u.searchParams.get('p');
    if (p && !isNaN(parseInt(p, 10))) {
      pageParam = parseInt(p, 10);
    } else {
      const match = u.pathname.match(/\/page\/(\d+)/i);
      if (match) pageParam = parseInt(match[1], 10);
    }
  } catch {
    // fallback
  }

  // 7. URL tracking params
  const urlParams = getTrackingParams(pageUrl);

  return {
    url: pageUrl,
    html,
    headers: headersText,
    title,
    h1,
    headCanonicalTags,
    bodyCanonicalTags,
    headerCanonical,
    metaRobots,
    hreflangTags,
    pagination: {
      relNext,
      relPrev,
      pageParam,
    },
    urlParams,
  };
}

/**
 * Evaluates all canonical SEO rules for a single page
 */
export function auditPage(
  pageUrl: string,
  html: string,
  headersText: string = '',
  targetOverride?: { statusCode?: number; hasNoIndex?: boolean }
): PageAuditResult {
  const parsedData = parsePageSource(html, pageUrl, headersText);
  const issues: AuditIssue[] = [];

  const allCanonicalElements = [...parsedData.headCanonicalTags, ...parsedData.bodyCanonicalTags];
  const totalTagsCount = allCanonicalElements.length + (parsedData.headerCanonical ? 1 : 0);

  // Primary Canonical Target (from head first, then body, then header)
  let rawCanonicalHref = '';
  let primaryLocation: 'head' | 'body' | 'header' = 'head';
  if (parsedData.headCanonicalTags.length > 0) {
    rawCanonicalHref = parsedData.headCanonicalTags[0].href;
    primaryLocation = 'head';
  } else if (parsedData.bodyCanonicalTags.length > 0) {
    rawCanonicalHref = parsedData.bodyCanonicalTags[0].href;
    primaryLocation = 'body';
  } else if (parsedData.headerCanonical?.url) {
    rawCanonicalHref = parsedData.headerCanonical.url;
    primaryLocation = 'header';
  }

  // Resolve absolute URL
  let resolvedCanonicalTarget: string | null = null;
  let isRelative = false;
  if (rawCanonicalHref) {
    if (rawCanonicalHref.startsWith('http://') || rawCanonicalHref.startsWith('https://')) {
      resolvedCanonicalTarget = normalizeUrl(rawCanonicalHref);
    } else {
      isRelative = true;
      resolvedCanonicalTarget = normalizeUrl(rawCanonicalHref, pageUrl);
    }
  }

  const normalizedPageUrl = normalizeUrl(pageUrl);
  const isSelfCanonical = Boolean(resolvedCanonicalTarget && resolvedCanonicalTarget === normalizedPageUrl);

  let isCrossDomain = false;
  try {
    if (resolvedCanonicalTarget && pageUrl) {
      const pageHost = new URL(pageUrl).hostname.toLowerCase();
      const targetHost = new URL(resolvedCanonicalTarget).hostname.toLowerCase();
      if (pageHost !== targetHost) {
        isCrossDomain = true;
      }
    }
  } catch {
    // ignore parsing errors
  }

  // ==========================================
  // RULE 1: Presence & Multi-tag Checks
  // ==========================================
  if (totalTagsCount === 0) {
    issues.push({
      id: 'presence-missing',
      category: 'presence',
      title: 'Missing Canonical Tag',
      severity: 'fail',
      summary: 'No rel="canonical" tag found in <head>, <body>, or HTTP response headers.',
      extractedTag: 'None',
      parsedMeaning: 'No canonical signal provided.',
      seoConsequence: 'Search engines will use algorithmic fallback to guess canonical version, risking index bloat or ranking split if parameters/variants exist.',
      recommendedAction: 'Add a self-referencing <link rel="canonical" href="..."> tag inside the <head> of this page.',
    });
  } else if (totalTagsCount === 1) {
    issues.push({
      id: 'presence-ok',
      category: 'presence',
      title: 'Canonical Tag Present',
      severity: 'pass',
      summary: `Single canonical tag detected in ${primaryLocation}.`,
      extractedTag: rawCanonicalHref ? `<link rel="canonical" href="${rawCanonicalHref}">` : parsedData.headerCanonical?.rawHeader || '',
      parsedMeaning: `Target URL: ${resolvedCanonicalTarget || rawCanonicalHref}`,
      seoConsequence: 'Provides search engines with an explicit hint regarding the authoritative URL.',
      recommendedAction: 'Keep tag intact during deployments.',
    });
  } else {
    issues.push({
      id: 'presence-multiple',
      category: 'presence',
      title: 'Multiple Canonical Tags Detected',
      severity: 'fail',
      summary: `Found ${totalTagsCount} canonical tags on this single page.`,
      extractedTag: allCanonicalElements.map((t) => t.raw).join('\n') + (parsedData.headerCanonical ? `\n${parsedData.headerCanonical.rawHeader}` : ''),
      parsedMeaning: 'Conflicting signals present on page.',
      seoConsequence: 'Search engines will treat conflicting canonical tags as invalid and either arbitrarily choose one or ignore all of them.',
      recommendedAction: 'Remove duplicate <link rel="canonical"> tags so only one clean tag remains in the <head>.',
    });
  }

  // ==========================================
  // RULE 2: Placement Outside <head>
  // ==========================================
  if (parsedData.bodyCanonicalTags.length > 0) {
    issues.push({
      id: 'placement-body',
      category: 'placement',
      title: 'Canonical Tag Placed Outside <head>',
      severity: 'fail',
      summary: 'Canonical tag was found inside <body> instead of <head>.',
      extractedTag: parsedData.bodyCanonicalTags.map((t) => t.raw).join('\n'),
      parsedMeaning: 'Invalid HTML spec placement.',
      seoConsequence: 'Google and Bing specifications state canonical tags must reside in <head>. Tags in <body> may be completely ignored.',
      recommendedAction: 'Move the <link rel="canonical"> element from the <body> into the <head> section.',
    });
  }

  // ==========================================
  // RULE 3: HTTP Response Header Canonical
  // ==========================================
  if (parsedData.headerCanonical) {
    issues.push({
      id: 'header-canonical-found',
      category: 'presence',
      title: 'HTTP Header Canonical Signal Detected',
      severity: 'pass',
      summary: 'HTTP response contains "Link: <url>; rel=canonical".',
      extractedTag: parsedData.headerCanonical.rawHeader,
      parsedMeaning: `Header Target: ${parsedData.headerCanonical.url}`,
      seoConsequence: 'HTTP header canonicals are effective for non-HTML files (like PDFs) or rendered HTML pages.',
      recommendedAction: 'Ensure HTTP header canonical matches HTML <head> canonical to prevent conflicting signals.',
    });
  } else {
    issues.push({
      id: 'header-canonical-note',
      category: 'presence',
      title: 'HTTP Header Canonical Status',
      severity: 'info',
      summary: headersText ? 'No canonical tag present in HTTP headers.' : 'HTTP Headers unverified (Paste headers manually or fetch directly).',
      extractedTag: headersText ? 'No Link header' : 'Headers not supplied',
      parsedMeaning: headersText ? 'Only HTML canonical tag active' : 'CORS prevents reading external headers client-side',
      seoConsequence: 'Client-side cross-origin fetches cannot read headers unless exposed via CORS headers. Manually pasting response headers provides reliable validation.',
      recommendedAction: 'Paste HTTP response headers in the Header Input field to audit Link header canonicals.',
    });
  }

  // ==========================================
  // RULE 4: Relative vs Absolute URL
  // ==========================================
  if (isRelative) {
    issues.push({
      id: 'url-relative',
      category: 'url_structure',
      title: 'Relative Canonical URL Warning',
      severity: 'warning',
      summary: `Canonical URL is relative ("${rawCanonicalHref}").`,
      extractedTag: `<link rel="canonical" href="${rawCanonicalHref}">`,
      parsedMeaning: `Resolves to: ${resolvedCanonicalTarget}`,
      seoConsequence: 'Relative canonicals work technically, but risk misinterpretation if reverse proxies, CDNs, or base tags change the document location.',
      recommendedAction: `Change relative path to full absolute URL: ${resolvedCanonicalTarget}`,
    });
  } else if (rawCanonicalHref) {
    issues.push({
      id: 'url-absolute',
      category: 'url_structure',
      title: 'Absolute Canonical URL Confirmed',
      severity: 'pass',
      summary: 'Canonical URL uses a full absolute protocol and domain.',
      extractedTag: `<link rel="canonical" href="${rawCanonicalHref}">`,
      parsedMeaning: rawCanonicalHref,
      seoConsequence: 'Prevents URL resolution ambiguity across CDN layers or URL rewrites.',
      recommendedAction: 'Maintain absolute URL format.',
    });
  }

  // ==========================================
  // RULE 5: Self-referencing vs Cross-domain
  // ==========================================
  if (resolvedCanonicalTarget) {
    if (isSelfCanonical) {
      issues.push({
        id: 'canonical-self-referencing',
        category: 'canonical_target',
        title: 'Self-Referencing Canonical Confirmed',
        severity: 'pass',
        summary: 'Canonical points directly to this page URL (healthy baseline state).',
        extractedTag: `<link rel="canonical" href="${rawCanonicalHref}">`,
        parsedMeaning: `Matches page URL: ${normalizedPageUrl}`,
        seoConsequence: 'Confirms this page is the authoritative master version, shielding against index dilution from parameter variations.',
        recommendedAction: 'No action required.',
      });
    } else if (isCrossDomain) {
      issues.push({
        id: 'canonical-cross-domain',
        category: 'canonical_target',
        title: 'Cross-Domain Canonical Detected',
        severity: 'warning',
        summary: `Canonical points to a different domain/subdomain.`,
        extractedTag: `<link rel="canonical" href="${rawCanonicalHref}">`,
        parsedMeaning: `Target Domain: ${new URL(resolvedCanonicalTarget).hostname} vs Page Domain: ${pageUrl ? new URL(pageUrl).hostname : 'unknown'}`,
        seoConsequence: 'Legitimate for syndicated content, but a common critical mistake on staging environments or cloned site templates.',
        recommendedAction: 'Verify this cross-domain canonical is intentional (e.g. content syndication) and not a staging domain leak.',
      });
    } else {
      issues.push({
        id: 'canonical-different-internal',
        category: 'canonical_target',
        title: 'Canonical Points to Alternate Internal Page',
        severity: 'info',
        summary: 'Page canonicalizes to another URL on the same domain.',
        extractedTag: `<link rel="canonical" href="${rawCanonicalHref}">`,
        parsedMeaning: `Canonical Target: ${resolvedCanonicalTarget}`,
        seoConsequence: 'Instructs search engines that this page is a duplicate/variant and should transfer ranking authority to the target URL.',
        recommendedAction: 'Confirm this page is indeed a duplicate or variant of the target URL.',
      });
    }
  }

  // ==========================================
  // RULE 6: Meta Robots (noindex) Conflict
  // ==========================================
  const hasNoIndex = parsedData.metaRobots.some((m) => m.includes('noindex')) || Boolean(targetOverride?.hasNoIndex);
  if (hasNoIndex && resolvedCanonicalTarget && !isSelfCanonical) {
    issues.push({
      id: 'conflict-noindex-canonical',
      category: 'conflict',
      title: 'Meta Robots (noindex) vs Canonical Contradiction',
      severity: 'fail',
      summary: 'Page contains noindex directive AND points canonical to another URL.',
      extractedTag: `<meta name="robots" content="${parsedData.metaRobots.join(', ')}">\n<link rel="canonical" href="${rawCanonicalHref}">`,
      parsedMeaning: `Page is marked noindex, but canonical points to ${resolvedCanonicalTarget}`,
      seoConsequence: 'Sending mixed signals: search engines may ignore the canonical hint or unintentionally drop the target page from the index.',
      recommendedAction: 'Remove noindex if you want ranking signals to transfer via canonical, or remove canonical if page should be excluded.',
    });
  }

  // ==========================================
  // RULE 7: Pagination Pattern Check
  // ==========================================
  const isPaginated = Boolean(parsedData.pagination.pageParam && parsedData.pagination.pageParam > 1) || Boolean(parsedData.pagination.relNext || parsedData.pagination.relPrev);
  if (isPaginated) {
    if (isSelfCanonical) {
      issues.push({
        id: 'pagination-self-canonical',
        category: 'conflict',
        title: 'Pagination Canonical Pattern Correct',
        severity: 'pass',
        summary: 'Paginated page correctly canonicalizes to itself.',
        extractedTag: `<link rel="canonical" href="${rawCanonicalHref}">`,
        parsedMeaning: `Page ${parsedData.pagination.pageParam || 'variant'} canonicalizes to self: ${resolvedCanonicalTarget}`,
        seoConsequence: 'Follows modern Google guidelines: ensures paginated content remains indexed while maintaining pagination structure.',
        recommendedAction: 'Maintain self-referencing canonical across all paginated pages.',
      });
    } else if (resolvedCanonicalTarget && !resolvedCanonicalTarget.includes('page=') && !resolvedCanonicalTarget.includes('/page/')) {
      issues.push({
        id: 'pagination-legacy-issue',
        category: 'conflict',
        title: 'Legacy Pagination Canonical Bug',
        severity: 'fail',
        summary: 'Paginated page canonicalizes back to Page 1 / Base Category URL.',
        extractedTag: `<link rel="canonical" href="${rawCanonicalHref}">`,
        parsedMeaning: `Paginated page (${parsedData.pagination.pageParam || 'page 2+'}) points canonical to base page: ${resolvedCanonicalTarget}`,
        seoConsequence: 'Google deprecated canonicalizing paginated pages to Page 1. This practice actively de-indexes products on pages 2+.',
        recommendedAction: 'Update paginated pages to use self-referencing canonical URLs.',
      });
    }
  }

  // ==========================================
  // RULE 8: hreflang + Canonical Conflict
  // ==========================================
  if (parsedData.hreflangTags.length > 0) {
    if (isSelfCanonical) {
      issues.push({
        id: 'hreflang-self-canonical',
        category: 'conflict',
        title: 'hreflang & Canonical Configuration Intact',
        severity: 'pass',
        summary: 'Language/region variant canonicalizes to itself as required.',
        extractedTag: parsedData.hreflangTags.slice(0, 2).map((h) => h.raw).join('\n') + `\n<link rel="canonical" href="${rawCanonicalHref}">`,
        parsedMeaning: 'Each international locale has its own self-referencing canonical.',
        seoConsequence: 'Ensures regional search engines accurately serve localized content to appropriate country users.',
        recommendedAction: 'Keep regional pages self-referencing.',
      });
    } else {
      issues.push({
        id: 'hreflang-master-conflict',
        category: 'conflict',
        title: 'hreflang + Canonical Conflict Detected',
        severity: 'fail',
        summary: 'Page has hreflang tags but canonicalizes to a master language URL.',
        extractedTag: parsedData.hreflangTags.slice(0, 2).map((h) => h.raw).join('\n') + `\n<link rel="canonical" href="${rawCanonicalHref}">`,
        parsedMeaning: `Regional page points canonical to different master URL: ${resolvedCanonicalTarget}`,
        seoConsequence: 'Critical International SEO Error: Canonicalizing localized variants to one master URL invalidates hreflang annotations and prevents regional indexing.',
        recommendedAction: 'Set canonical URL on each language variant to point to itself.',
      });
    }
  }

  // ==========================================
  // RULE 9: URL Tracking Parameter Handling
  // ==========================================
  const trackingParamKeys = Object.keys(parsedData.urlParams);
  if (trackingParamKeys.length > 0) {
    if (resolvedCanonicalTarget) {
      const canonicalHasTracking = trackingParamKeys.some((k) => resolvedCanonicalTarget?.toLowerCase().includes(k.toLowerCase()));
      if (!canonicalHasTracking) {
        issues.push({
          id: 'params-stripped-clean',
          category: 'url_structure',
          title: 'Tracking Parameters Stripped Clean',
          severity: 'pass',
          summary: `URL has parameters (${trackingParamKeys.join(', ')}), but canonical points to clean URL.`,
          extractedTag: `<link rel="canonical" href="${rawCanonicalHref}">`,
          parsedMeaning: `Clean target: ${resolvedCanonicalTarget}`,
          seoConsequence: 'Consolidates search traffic and analytics signals to the parameter-free clean URL.',
          recommendedAction: 'No action required.',
        });
      } else {
        issues.push({
          id: 'params-in-canonical',
          category: 'url_structure',
          title: 'Tracking Parameters Found in Canonical Target',
          severity: 'warning',
          summary: 'Canonical URL contains session or tracking parameters.',
          extractedTag: `<link rel="canonical" href="${rawCanonicalHref}">`,
          parsedMeaning: `Canonical target includes params: ${rawCanonicalHref}`,
          seoConsequence: 'Search engines may index URLs with session query strings, causing duplicate content issues.',
          recommendedAction: 'Strip UTM parameters, session IDs, and tracking query strings from the canonical href.',
        });
      }
    }
  }

  // ==========================================
  // RULE 10: Target Page Status / CORS Verification
  // ==========================================
  const overrideStatus = targetOverride?.statusCode;
  if (overrideStatus) {
    if (overrideStatus === 200) {
      issues.push({
        id: 'target-status-200',
        category: 'canonical_target',
        title: 'Canonical Target HTTP Status 200 OK',
        severity: 'pass',
        summary: 'Canonical target page returned HTTP status 200.',
        extractedTag: `Target: ${resolvedCanonicalTarget}`,
        parsedMeaning: 'Target page is live and accessible.',
        seoConsequence: 'Search engines can crawl and index the target page.',
        recommendedAction: 'No action required.',
      });
    } else if ([301, 302, 307, 308].includes(overrideStatus)) {
      issues.push({
        id: 'target-status-redirect',
        category: 'canonical_target',
        title: 'Canonical Target Redirects (30x)',
        severity: 'fail',
        summary: `Canonical target returns HTTP redirect status ${overrideStatus}.`,
        extractedTag: `Target: ${resolvedCanonicalTarget}`,
        parsedMeaning: 'Target is a redirecting URL.',
        seoConsequence: 'Search engines ignore canonical hints pointing to redirecting URLs or create indirect redirection loops.',
        recommendedAction: 'Update canonical tag to point directly to the final destination URL.',
      });
    } else if (overrideStatus === 404 || overrideStatus === 410) {
      issues.push({
        id: 'target-status-404',
        category: 'canonical_target',
        title: 'Canonical Target Not Found (404/410)',
        severity: 'fail',
        summary: `Canonical target returns HTTP status ${overrideStatus}.`,
        extractedTag: `Target: ${resolvedCanonicalTarget}`,
        parsedMeaning: 'Target page does not exist.',
        seoConsequence: 'Canonical tags pointing to 404 errors cause search engines to ignore the canonical signal completely.',
        recommendedAction: 'Point canonical to an active, live 200 OK URL.',
      });
    }
  } else if (resolvedCanonicalTarget && !isSelfCanonical) {
    issues.push({
      id: 'target-status-unverified',
      category: 'canonical_target',
      title: 'Target HTTP Status Unverified',
      severity: 'unverified',
      summary: 'Target page status cannot be verified client-side due to browser CORS rules.',
      extractedTag: `Target: ${resolvedCanonicalTarget}`,
      parsedMeaning: 'Requires manual status confirmation.',
      seoConsequence: 'Verify that the target URL returns HTTP status 200 OK and does not redirect or 404.',
      recommendedAction: 'Use the Target Status Override tool below to simulate 200 OK or 404 response testing.',
    });
  }

  // Calculate overall health score (0-100)
  const failsCount = issues.filter((i) => i.severity === 'fail').length;
  const warningsCount = issues.filter((i) => i.severity === 'warning').length;
  const passesCount = issues.filter((i) => i.severity === 'pass').length;
  const unverifiedCount = issues.filter((i) => i.severity === 'unverified').length;

  let score = 100 - failsCount * 30 - warningsCount * 12;
  if (score < 0) score = 0;

  return {
    id: `audit-${Math.random().toString(36).substr(2, 9)}`,
    pageUrl,
    htmlSource: html,
    headersSource: headersText,
    title: parsedData.title,
    h1: parsedData.h1,
    issues,
    score,
    stats: {
      passes: passesCount,
      warnings: warningsCount,
      fails: failsCount,
      unverified: unverifiedCount,
    },
    canonicalTarget: resolvedCanonicalTarget,
    isSelfCanonical,
    isCrossDomain,
    isRelative,
    parsedData,
    targetOverride,
  };
}

/**
 * Bulk Cross-Page Analysis: Clusters pages, detects orphaned targets, canonical chains, and duplicate titles
 */
export function analyzeBulkAudit(results: PageAuditResult[]): {
  clusters: BulkCluster[];
  chains: Array<{ sourceUrl: string; targetUrl: string; finalTargetUrl: string }>;
  duplicateTitles: DuplicateTitleCluster[];
} {
  // 1. Cluster pages by canonical target
  const targetMap = new Map<string, Array<{ pageId: string; url: string; title: string; h1: string; canonicalTarget: string }>>();

  for (const res of results) {
    const target = res.canonicalTarget || 'NO_CANONICAL_DECLARED';
    if (!targetMap.has(target)) {
      targetMap.set(target, []);
    }
    targetMap.get(target)!.push({
      pageId: res.id,
      url: res.pageUrl,
      title: res.title,
      h1: res.h1,
      canonicalTarget: target,
    });
  }

  const allAuditedUrls = new Set(results.map((r) => normalizeUrl(r.pageUrl)));

  const clusters: BulkCluster[] = [];
  targetMap.forEach((pages, target) => {
    if (target === 'NO_CANONICAL_DECLARED') return;
    const isOrphaned = !allAuditedUrls.has(normalizeUrl(target));
    clusters.push({
      canonicalTarget: target,
      pages,
      isOrphaned,
    });
  });

  // 2. Canonical Chain Detection across batch
  const chains: Array<{ sourceUrl: string; targetUrl: string; finalTargetUrl: string }> = [];
  const resultMapByUrl = new Map<string, PageAuditResult>();
  results.forEach((r) => resultMapByUrl.set(normalizeUrl(r.pageUrl), r));

  for (const res of results) {
    if (res.canonicalTarget) {
      const hop1 = resultMapByUrl.get(normalizeUrl(res.canonicalTarget));
      if (hop1 && hop1.canonicalTarget && normalizeUrl(hop1.canonicalTarget) !== normalizeUrl(res.canonicalTarget)) {
        chains.push({
          sourceUrl: res.pageUrl,
          targetUrl: res.canonicalTarget,
          finalTargetUrl: hop1.canonicalTarget,
        });
      }
    }
  }

  // 3. Near-Duplicate Title / H1 analysis
  const titleMap = new Map<string, Array<{ pageId: string; url: string; canonicalTarget: string | null }>>();
  for (const res of results) {
    const cleanTitle = res.title.trim().toLowerCase();
    if (cleanTitle && cleanTitle !== 'no title tag found') {
      if (!titleMap.has(cleanTitle)) {
        titleMap.set(cleanTitle, []);
      }
      titleMap.get(cleanTitle)!.push({
        pageId: res.id,
        url: res.pageUrl,
        canonicalTarget: res.canonicalTarget,
      });
    }
  }

  const duplicateTitles: DuplicateTitleCluster[] = [];
  titleMap.forEach((pages, titleText) => {
    if (pages.length > 1) {
      const distinctTargets = new Set(pages.map((p) => p.canonicalTarget || 'NONE'));
      duplicateTitles.push({
        text: titleText,
        type: 'title',
        pages,
        hasDifferentCanonicals: distinctTargets.size > 1,
      });
    }
  });

  return {
    clusters,
    chains,
    duplicateTitles,
  };
}
