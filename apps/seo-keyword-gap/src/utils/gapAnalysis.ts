import { ClassifiedPage, GapOpportunity, PlacementItem } from '../types';

/**
 * Checks if two keyword terms or titles overlap significantly
 */
function isKeywordOverlap(term1: string, term2: string): boolean {
  if (!term1 || !term2) return false;
  const t1 = term1.toLowerCase().trim();
  const t2 = term2.toLowerCase().trim();

  if (t1 === t2 || t1.includes(t2) || t2.includes(t1)) return true;

  const words1 = t1.split(/\s+/).filter(w => w.length > 3);
  const words2 = t2.split(/\s+/).filter(w => w.length > 3);

  if (words1.length === 0 || words2.length === 0) return false;

  const commonWords = words1.filter(w => words2.includes(w));
  // If at least 2 key words overlap or >50% overlap
  return commonWords.length >= 2 || (commonWords.length >= 1 && words1.length <= 2);
}

/**
 * Capitalizes title words cleanly
 */
function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Creates placement checklist blueprint for a new gap page
 */
export function buildPlacementChecklistForGap(
  primaryKw: string,
  secondaryKws: string[],
  pageType: 'service' | 'blog',
  suggestedSlug: string
): PlacementItem[] {
  const capKw = capitalizeWords(primaryKw);
  
  return [
    {
      element: 'Title Tag',
      status: 'recommended',
      recommendation: `Set title tag to: "${capKw} | [Your Brand Name]" (keep under 60 characters).`,
      importance: 'critical'
    },
    {
      element: 'H1 Heading',
      status: 'recommended',
      recommendation: `Use a single <h1> heading featuring exact match: "${capKw}".`,
      importance: 'critical'
    },
    {
      element: 'URL Slug',
      status: 'recommended',
      recommendation: `Publish under URL path: ${pageType === 'service' ? '/services' : '/blog'}/${suggestedSlug}`,
      importance: 'high'
    },
    {
      element: 'First 100 Words',
      status: 'recommended',
      recommendation: `Naturally incorporate "${primaryKw}" in the first 1-2 sentences of opening body copy.`,
      importance: 'high'
    },
    {
      element: 'Image Alt Text',
      status: 'recommended',
      recommendation: `Include primary keyword or secondary variant (${secondaryKws[0] || primaryKw}) in main hero image alt attribute.`,
      importance: 'medium'
    },
    {
      element: 'Internal Link Anchor',
      status: 'recommended',
      recommendation: `Add 2-3 internal links from existing high-authority pages using anchor text "${primaryKw}".`,
      importance: 'medium'
    }
  ];
}

/**
 * Performs Gap Analysis comparing Competitor Pages against Own Site Pages
 */
export function generateGapAnalysis(
  competitorPages: ClassifiedPage[],
  ownPages: ClassifiedPage[]
): GapOpportunity[] {
  const gaps: GapOpportunity[] = [];

  // Filter Competitor Pages (Service & Blog)
  const compServices = competitorPages.filter(p => p.category === 'service' && p.primaryKeyword);
  const compBlogs = competitorPages.filter(p => p.category === 'blog' && p.primaryKeyword);

  const ownServices = ownPages.filter(p => p.category === 'service');
  const ownBlogs = ownPages.filter(p => p.category === 'blog');

  // 1. Analyze Service Page Gaps
  compServices.forEach(compPage => {
    const primaryKw = compPage.primaryKeyword?.term || '';
    if (!primaryKw) return;

    // Check if own site has a matching service page covering this primary or secondary keywords
    const hasMatchingOwnService = ownServices.some(ownP => {
      const ownPrimary = ownP.primaryKeyword?.term || '';
      const ownSecondaries = ownP.secondaryKeywords.map(k => k.term);
      const title = ownP.metadata.title;
      const h1 = ownP.metadata.h1;

      return (
        isKeywordOverlap(primaryKw, ownPrimary) ||
        isKeywordOverlap(primaryKw, title) ||
        isKeywordOverlap(primaryKw, h1) ||
        ownSecondaries.some(sec => isKeywordOverlap(primaryKw, sec))
      );
    });

    if (!hasMatchingOwnService) {
      const secondaryKws = compPage.secondaryKeywords.map(k => k.term);
      const capKw = capitalizeWords(primaryKw);
      const suggestedSlug = primaryKw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const workingTitle = `${capKw} Services`;
      const reasoning = `Competitor covers "${primaryKw}" with a dedicated Service Page (${compPage.metadata.wordCount} words, "${compPage.metadata.title}"), but your site has no matching service page targeting this topic.`;

      gaps.push({
        id: `gap_${Math.random().toString(36).substr(2, 9)}`,
        competitorPageUrl: compPage.metadata.url,
        competitorPageTitle: compPage.metadata.title || compPage.metadata.h1 || 'Untitled Competitor Service',
        suggestedPageType: 'service',
        workingTitle,
        suggestedSlug,
        targetPrimaryKeyword: primaryKw,
        targetSecondaryKeywords: secondaryKws,
        searchVolume: compPage.primaryKeyword?.volume,
        isVolumeBacked: compPage.primaryKeyword?.isVolumeBacked || false,
        reasoning,
        competitorWordCount: compPage.metadata.wordCount,
        placementChecklist: buildPlacementChecklistForGap(primaryKw, secondaryKws, 'service', suggestedSlug)
      });
    }
  });

  // 2. Analyze Blog / Article Page Gaps
  compBlogs.forEach(compPage => {
    const primaryKw = compPage.primaryKeyword?.term || '';
    if (!primaryKw) return;

    const hasMatchingOwnBlog = ownBlogs.some(ownP => {
      const ownPrimary = ownP.primaryKeyword?.term || '';
      const title = ownP.metadata.title;
      const h1 = ownP.metadata.h1;

      return (
        isKeywordOverlap(primaryKw, ownPrimary) ||
        isKeywordOverlap(primaryKw, title) ||
        isKeywordOverlap(primaryKw, h1)
      );
    });

    if (!hasMatchingOwnBlog) {
      const secondaryKws = compPage.secondaryKeywords.map(k => k.term);
      const capKw = capitalizeWords(primaryKw);
      const suggestedSlug = primaryKw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const workingTitle = `The Complete Guide to ${capKw}`;
      const reasoning = `Competitor published an article/guide on "${primaryKw}" (${compPage.metadata.wordCount} words), capturing informational search volume that your blog currently misses.`;

      gaps.push({
        id: `gap_${Math.random().toString(36).substr(2, 9)}`,
        competitorPageUrl: compPage.metadata.url,
        competitorPageTitle: compPage.metadata.title || compPage.metadata.h1 || 'Untitled Competitor Article',
        suggestedPageType: 'blog',
        workingTitle,
        suggestedSlug,
        targetPrimaryKeyword: primaryKw,
        targetSecondaryKeywords: secondaryKws,
        searchVolume: compPage.primaryKeyword?.volume,
        isVolumeBacked: compPage.primaryKeyword?.isVolumeBacked || false,
        reasoning,
        competitorWordCount: compPage.metadata.wordCount,
        placementChecklist: buildPlacementChecklistForGap(primaryKw, secondaryKws, 'blog', suggestedSlug)
      });
    }
  });

  return gaps;
}
