import { DiagnosticIssue, ParsedRobots } from '../types';

export function analyzeRobotsTxt(parsed: ParsedRobots): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [...parsed.syntaxIssues];

  // 1. Check for missing Sitemap directive
  if (parsed.sitemaps.length === 0) {
    issues.push({
      id: 'missing-sitemap',
      severity: 'warning',
      title: 'Missing Sitemap Directive',
      message: 'No "Sitemap:" directive was found in the robots.txt file.',
      explanation:
        'Including one or more "Sitemap: https://example.com/sitemap.xml" directives helps search engines discover your canonical site structure and new content faster.',
    });
  }

  // 2. Analyze each User-Agent Group for common SEO misconfigurations
  parsed.groups.forEach((group, index) => {
    const isWildcardGroup = group.userAgents.includes('*');
    const uasLabel = group.userAgents.join(', ');

    // Check for Disallow: / in User-agent: *
    if (isWildcardGroup) {
      const blockAllRule = group.rules.find(
        (r) => r.type === 'disallow' && (r.pattern === '/' || r.pattern === '/*')
      );
      if (blockAllRule) {
        // Check if there is an Allow rule overriding it or if it's completely blocked
        const allowRules = group.rules.filter((r) => r.type === 'allow');
        issues.push({
          id: `critical-block-all-${blockAllRule.lineNumber}`,
          severity: 'critical',
          title: 'Entire Site Blocked from Crawling',
          message: `Line ${blockAllRule.lineNumber} contains "Disallow: ${blockAllRule.pattern}" under "User-agent: *".`,
          explanation:
            'This rule instructs all search engines (including Googlebot) NOT to crawl any pages on your website. Unless this is an unindexed staging server, this will de-index your site from search results.',
          lineNumber: blockAllRule.lineNumber,
          groupIndex: index,
        });
      }
    }

    // Check if robots.txt itself is disallowed
    const disallowRobotsRule = group.rules.find(
      (r) =>
        r.type === 'disallow' &&
        (r.pattern.includes('robots.txt') || r.pattern === '/robots.txt')
    );
    if (disallowRobotsRule) {
      issues.push({
        id: `disallow-robots-${disallowRobotsRule.lineNumber}`,
        severity: 'critical',
        title: 'Robots.txt File Disallowed',
        message: `Line ${disallowRobotsRule.lineNumber} disallows crawling of "/robots.txt" itself.`,
        explanation:
          'Blocking access to your robots.txt file creates a logical conflict and may cause crawlers to assume total restriction or default behavior.',
        lineNumber: disallowRobotsRule.lineNumber,
        groupIndex: index,
      });
    }

    // Check for rules blocking CSS/JS/Image rendering assets
    group.rules.forEach((rule) => {
      if (rule.type === 'disallow') {
        const pat = rule.pattern.toLowerCase();
        const isAssetBlock =
          pat.endsWith('.css') ||
          pat.endsWith('.js') ||
          pat.includes('.css?') ||
          pat.includes('.js?') ||
          pat.includes('/wp-content/') ||
          pat.includes('/wp-includes/') ||
          pat.includes('/assets/') ||
          pat.includes('/css/') ||
          pat.includes('/js/');

        if (isAssetBlock) {
          issues.push({
            id: `rendering-asset-blocked-${rule.lineNumber}`,
            severity: 'warning',
            title: 'Rendering-Critical Asset Blocked',
            message: `Line ${rule.lineNumber} ("Disallow: ${rule.pattern}") may block CSS, JS, or theme assets needed for rendering.`,
            explanation:
              'Googlebot renders pages like a modern modern browser. Blocking CSS, JavaScript, or core layout assets prevents Google from accurately evaluating page layout, mobile-friendliness, and visual content.',
            lineNumber: rule.lineNumber,
            groupIndex: index,
          });
        }
      }
    });

    // Check for Crawl-delay notice
    if (group.crawlDelay !== undefined) {
      issues.push({
        id: `crawl-delay-notice-${group.crawlDelayLineNumber || index}`,
        severity: 'notice',
        title: 'Crawl-Delay Directive Present',
        message: `Line ${group.crawlDelayLineNumber} sets "Crawl-delay: ${group.crawlDelay}" for group [${uasLabel}].`,
        explanation:
          'Note: Googlebot completely ignores the Crawl-delay directive (Google manages crawl speed automatically in Search Console). However, Bingbot, Yandex, and Yahoo do respect Crawl-delay.',
        lineNumber: group.crawlDelayLineNumber,
        groupIndex: index,
      });
    }

    // Check for conflicting or redundant rules in same group
    for (let i = 0; i < group.rules.length; i++) {
      for (let j = i + 1; j < group.rules.length; j++) {
        const r1 = group.rules[i];
        const r2 = group.rules[j];

        if (r1.pattern === r2.pattern) {
          if (r1.type !== r2.type) {
            issues.push({
              id: `rule-conflict-${r1.lineNumber}-${r2.lineNumber}`,
              severity: 'warning',
              title: 'Conflicting Rules with Identical Path',
              message: `Line ${r1.lineNumber} (${r1.type}: ${r1.pattern}) conflicts with Line ${r2.lineNumber} (${r2.type}: ${r2.pattern}).`,
              explanation:
                'In Googlebot mode, Allow beats Disallow on exact length ties regardless of line order. In strict RFC 9309 mode, the first rule wins.',
              lineNumber: r2.lineNumber,
              groupIndex: index,
            });
          }
        }
      }
    }
  });

  return issues;
}
