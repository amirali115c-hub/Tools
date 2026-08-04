import { ClassifiedPage, CannibalizationAlert, InternalLinkRecommendation, GapOpportunity } from '../types';

/**
 * Detect Keyword Cannibalization issues on own site pages
 */
export function detectCannibalization(ownPages: ClassifiedPage[]): CannibalizationAlert[] {
  const keywordPageMap = new Map<string, ClassifiedPage[]>();

  // Group pages by primary target keyword
  ownPages.forEach(p => {
    if (!p.primaryKeyword?.term) return;
    const kw = p.primaryKeyword.term.toLowerCase().trim();

    if (!keywordPageMap.has(kw)) {
      keywordPageMap.set(kw, []);
    }
    keywordPageMap.get(kw)!.push(p);
  });

  const alerts: CannibalizationAlert[] = [];

  keywordPageMap.forEach((competing, kw) => {
    if (competing.length > 1) {
      const topPage = competing[0];

      let riskLevel: CannibalizationAlert['riskLevel'] = 'Critical';
      if (competing.length === 2 && competing[0].category !== competing[1].category) {
        riskLevel = 'Moderate'; // e.g. service page vs blog post
      }

      let action: CannibalizationAlert['recommendedAction'] = 'Canonicalize to Main Page';
      if (riskLevel === 'Critical') {
        action = '301 Redirect & Merge';
      } else {
        action = 'De-optimize Secondary Page';
      }

      alerts.push({
        id: `cannibal_${Math.random().toString(36).substr(2, 7)}`,
        keyword: kw,
        competingPages: competing.map(p => ({
          url: p.metadata.url,
          title: p.metadata.title || p.metadata.h1 || 'Page',
          category: p.category,
          tfidfScore: p.primaryKeyword?.score || 0
        })),
        riskLevel,
        impactDescription: `${competing.length} pages are actively targeting the exact same keyword "${kw}". Search engines may confuse page authority and split rankings.`,
        recommendedAction: action,
        primaryTargetUrl: topPage.metadata.url
      });
    }
  });

  return alerts.sort((a, b) => (a.riskLevel === 'Critical' ? -1 : 1));
}

/**
 * Generate Internal Link Network Recommendations between own pages and gaps
 */
export function generateInternalLinkRecommendations(
  ownPages: ClassifiedPage[],
  gaps: GapOpportunity[] = []
): InternalLinkRecommendation[] {
  const recommendations: InternalLinkRecommendation[] = [];

  // 1. Link from Blog posts to Service Pillars
  const servicePages = ownPages.filter(p => p.category === 'service');
  const blogPages = ownPages.filter(p => p.category === 'blog');

  blogPages.forEach((blog, bIdx) => {
    servicePages.forEach((service, sIdx) => {
      if (service.primaryKeyword?.term) {
        const kwTerm = service.primaryKeyword.term;
        const blogText = `${blog.metadata.bodyText} ${blog.metadata.title}`.toLowerCase();

        // Check if blog content mentions service keyword topic
        if (blogText.includes(kwTerm.toLowerCase())) {
          recommendations.push({
            id: `link_blog_to_service_${bIdx}_${sIdx}`,
            sourceUrl: blog.metadata.url,
            sourceTitle: blog.metadata.title || blog.metadata.h1 || 'Blog Post',
            targetUrl: service.metadata.url,
            targetTitle: service.metadata.title || service.metadata.h1 || 'Service Page',
            suggestedAnchorText: kwTerm,
            relevancyScore: 95,
            placementContext: `Insert anchor text "${kwTerm}" inside editorial paragraph linking to main service page.`,
            targetType: 'Existing Page'
          });
        }
      }
    });
  });

  // 2. Link from Existing Blog/Service pages to NEW Gap pages
  gaps.forEach((gap, gIdx) => {
    ownPages.slice(0, 5).forEach((page, pIdx) => {
      const isRel = page.category === 'service' && gap.suggestedPageType === 'blog' || page.category === 'blog';
      if (isRel) {
        recommendations.push({
          id: `link_gap_${gIdx}_${pIdx}`,
          sourceUrl: page.metadata.url,
          sourceTitle: page.metadata.title || page.metadata.h1 || 'Existing Page',
          targetUrl: `/services/${gap.suggestedSlug}`,
          targetTitle: gap.workingTitle,
          suggestedAnchorText: gap.targetPrimaryKeyword,
          relevancyScore: 88,
          placementContext: `Add contextual text bridge: "For detailed strategy, see our guide on ${gap.targetPrimaryKeyword}".`,
          targetType: 'New Gap Page'
        });
      }
    });
  });

  // Remove duplicates and return top recommendations
  const uniqueMap = new Map<string, InternalLinkRecommendation>();
  recommendations.forEach(r => {
    const key = `${r.sourceUrl}->${r.targetUrl}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, r);
    }
  });

  return Array.from(uniqueMap.values()).slice(0, 15).sort((a, b) => b.relevancyScore - a.relevancyScore);
}
