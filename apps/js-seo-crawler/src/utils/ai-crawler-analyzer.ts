import {AICrawlerResult} from '../types/phase1';

const AI_CRAWLERS = [
  {
    name: 'GPTBot',
    userAgent: 'GPTBot/1.0',
    description: 'OpenAI ChatGPT crawler',
    robotsDirective: 'GPTBot',
  },
  {
    name: 'ClaudeBot',
    userAgent: 'ClaudeBot/1.0',
    description: 'Anthropic Claude crawler',
    robotsDirective: 'ClaudeBot',
  },
  {
    name: 'PerplexityBot',
    userAgent: 'PerplexityBot/1.0',
    description: 'Perplexity AI crawler',
    robotsDirective: 'PerplexityBot',
  },
  {
    name: 'Google-Extended',
    userAgent: 'Google-Extended/1.0',
    description: 'Google AI training crawler',
    robotsDirective: 'Google-Extended',
  },
  {
    name: 'Bytespider',
    userAgent: 'Bytespider/1.0',
    description: 'ByteDance/TikTok crawler',
    robotsDirective: 'Bytespider',
  },
  {
    name: 'Amazonbot',
    userAgent: 'Amazonbot/1.0',
    description: 'Amazon/Alexa crawler',
    robotsDirective: 'Amazonbot',
  },
];

export function analyzeAICrawlerAccess(
  robotsTxt: string,
  html: string,
  headers?: Record<string, string>
): AICrawlerResult[] {
  const results: AICrawlerResult[] = [];

  for (const crawler of AI_CRAWLERS) {
    const issues: string[] = [];
    let canAccess = true;
    let seesContent = true;
    let seesJsContent = false;

    // Check robots.txt for AI crawler permissions
    const lines = robotsTxt.split('\n');
    let currentAgent = '';
    let isAllowed = true;
    let foundDirective = false;

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith('user-agent:')) {
        currentAgent = trimmed.split(':')[1].trim();
      }
      if (currentAgent === crawler.robotsDirective.toLowerCase() || currentAgent === '*') {
        if (trimmed.startsWith('disallow:')) {
          const path = trimmed.split(':')[1].trim();
          if (path === '/' || path === '') {
            isAllowed = false;
            foundDirective = true;
          }
        }
        if (trimmed.startsWith('allow:')) {
          isAllowed = true;
          foundDirective = true;
        }
      }
    }

    if (foundDirective && !isAllowed) {
      canAccess = false;
      issues.push(`Blocked by robots.txt (User-agent: ${crawler.robotsDirective})`);
    }

    // Check meta robots
    const metaRobots = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    if (metaRobots) {
      const content = metaRobots[1].toLowerCase();
      if (content.includes('noindex')) {
        issues.push('Page has noindex directive');
      }
      if (content.includes('nofollow')) {
        issues.push('Page has nofollow directive');
      }
    }

    // Check X-Robots-Tag header
    if (headers?.['x-robots-tag']?.toLowerCase().includes('noindex')) {
      issues.push('X-Robots-Tag header contains noindex');
    }

    // AI crawlers generally don't execute JavaScript
    if (html.includes('react') || html.includes('vue') || html.includes('angular')) {
      seesJsContent = false;
      if (!html.match(/<body[^>]*>([\s\S]{500,})<\/body>/i)) {
        issues.push('AI crawlers do not execute JavaScript - CSR content will not be seen');
      }
    }

    // Check if content is in initial HTML
    const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
    const textContent = bodyContent.replace(/<[^>]*>/g, '').trim();
    seesContent = textContent.length > 100;

    if (!seesContent) {
      issues.push('Very little content in initial HTML - may not be indexed by AI crawlers');
    }

    // Check for llms.txt
    if (!html.includes('llms.txt')) {
      // Not necessarily an issue per crawler, but worth noting
    }

    results.push({
      crawler: crawler.name,
      userAgent: crawler.userAgent,
      canAccess,
      seesContent,
      seesJsContent,
      issues,
    });
  }

  return results;
}

export function getAISummary(results: AICrawlerResult[]): {
  totalBlocked: number;
  totalWithIssues: number;
  criticalIssues: string[];
  recommendations: string[];
} {
  const totalBlocked = results.filter((r) => !r.canAccess).length;
  const totalWithIssues = results.filter((r) => r.issues.length > 0).length;
  const criticalIssues: string[] = [];
  const recommendations: string[] = [];

  if (totalBlocked > 0) {
    criticalIssues.push(`${totalBlocked} AI crawler(s) blocked by robots.txt`);
    recommendations.push('Review robots.txt to ensure AI crawlers are not accidentally blocked');
  }

  const csrIssues = results.filter((r) => !r.seesJsContent && r.issues.some((i) => i.includes('JavaScript')));
  if (csrIssues.length > 0) {
    criticalIssues.push(`${csrIssues.length} AI crawler(s) cannot see JavaScript-rendered content`);
    recommendations.push('AI crawlers do not execute JavaScript. Use SSR/SSG for content you want AI to cite.');
    recommendations.push('Consider adding static HTML fallbacks for critical content');
  }

  const noContent = results.filter((r) => !r.seesContent);
  if (noContent.length > 0) {
    criticalIssues.push(`${noContent.length} AI crawler(s) see very little content`);
    recommendations.push('Ensure meaningful content is in the initial HTML response');
  }

  if (criticalIssues.length === 0) {
    recommendations.push('Your site is accessible to AI crawlers');
    recommendations.push('Consider adding llms.txt for better AI visibility');
  }

  return {totalBlocked, totalWithIssues, criticalIssues, recommendations};
}
