import { ClassifiedPage, TopicCluster, GapOpportunity } from '../types';

/**
 * Standard semantic seed pillar templates for automated grouping
 */
const DEFAULT_PILLARS = [
  { name: 'SEO & Content Strategy', keywords: ['seo', 'keyword', 'content', 'search', 'ranking', 'brief', 'copywriting', 'blog', 'backlink', 'on-page'] },
  { name: 'B2B SaaS & Lead Generation', keywords: ['saas', 'b2b', 'lead', 'pipeline', 'conversion', 'funnel', 'growth', 'sales', 'crm', 'demo'] },
  { name: 'E-Commerce & Digital Retail', keywords: ['ecommerce', 'e-commerce', 'store', 'cart', 'checkout', 'product', 'shopify', 'retail', 'sku', 'shop'] },
  { name: 'Technical & Web Performance', keywords: ['technical', 'schema', 'crawl', 'index', 'speed', 'performance', 'sitemap', 'canonical', 'javascript', 'core web vitals'] },
  { name: 'Enterprise Analytics & Data', keywords: ['analytics', 'data', 'attribution', 'reporting', 'metrics', 'dashboard', 'roi', 'tracking', 'ga4', 'bi'] },
  { name: 'Paid Ads & PPC Optimization', keywords: ['ppc', 'google ads', 'paid', 'campaign', 'cpc', 'meta ads', 'retargeting', 'roas', 'adwords', 'bidding'] },
  { name: 'Local & Agency Growth', keywords: ['local', 'agency', 'client', 'gmb', 'google business', 'citations', 'multi-location', 'consulting', 'services', 'reviews'] }
];

/**
 * Generate Semantic Topic Clusters and calculate Topical Authority metrics
 */
export function generateTopicClusters(
  competitorPages: ClassifiedPage[],
  ownPages: ClassifiedPage[],
  gaps: GapOpportunity[] = []
): TopicCluster[] {
  // Collect all unique keywords with metadata
  const keywordMap = new Map<string, {
    term: string;
    volume: number;
    competitorPages: { url: string; title: string }[];
    ownPages: { url: string; title: string }[];
  }>();

  const addKeywordToMap = (term: string, vol: number, page: ClassifiedPage, siteType: 'Competitor' | 'Own Site') => {
    const cleanTerm = term.toLowerCase().trim();
    if (!cleanTerm || cleanTerm.length < 3) return;

    if (!keywordMap.has(cleanTerm)) {
      keywordMap.set(cleanTerm, {
        term: cleanTerm,
        volume: vol || 0,
        competitorPages: [],
        ownPages: []
      });
    }

    const item = keywordMap.get(cleanTerm)!;
    if (vol > item.volume) item.volume = vol;

    const pageInfo = { url: page.metadata.url, title: page.metadata.title || page.metadata.h1 || 'Page' };
    if (siteType === 'Competitor') {
      if (!item.competitorPages.some(p => p.url === pageInfo.url)) item.competitorPages.push(pageInfo);
    } else {
      if (!item.ownPages.some(p => p.url === pageInfo.url)) item.ownPages.push(pageInfo);
    }
  };

  // Populate from competitor pages
  competitorPages.forEach(p => {
    if (p.primaryKeyword) addKeywordToMap(p.primaryKeyword.term, p.primaryKeyword.volume || 0, p, 'Competitor');
    p.secondaryKeywords.forEach(sec => addKeywordToMap(sec.term, sec.volume || 0, p, 'Competitor'));
  });

  // Populate from own pages
  ownPages.forEach(p => {
    if (p.primaryKeyword) addKeywordToMap(p.primaryKeyword.term, p.primaryKeyword.volume || 0, p, 'Own Site');
    p.secondaryKeywords.forEach(sec => addKeywordToMap(sec.term, sec.volume || 0, p, 'Own Site'));
  });

  const allKeywords = Array.from(keywordMap.values());

  // Assign keywords to Pillar Clusters
  const clusters: TopicCluster[] = DEFAULT_PILLARS.map((pillar, idx) => {
    const clusterKeywords: typeof allKeywords = [];

    allKeywords.forEach(kw => {
      const matchesPillar = pillar.keywords.some(seed => kw.term.includes(seed));
      if (matchesPillar) {
        clusterKeywords.push(kw);
      }
    });

    // Calculate metrics
    const totalVol = clusterKeywords.reduce((sum, k) => sum + k.volume, 0);
    const competitorPageSet = new Set<string>();
    const ownPageSet = new Set<string>();

    clusterKeywords.forEach(k => {
      k.competitorPages.forEach(p => competitorPageSet.add(p.url));
      k.ownPages.forEach(p => ownPageSet.add(p.url));
    });

    const competitorCount = competitorPageSet.size;
    const ownCount = ownPageSet.size;

    // Coverage percentage score
    const kwTotal = clusterKeywords.length || 1;
    const competitorCoveredKw = clusterKeywords.filter(k => k.competitorPages.length > 0).length;
    const ownCoveredKw = clusterKeywords.filter(k => k.ownPages.length > 0).length;

    const competitorCoverage = Math.round((competitorCoveredKw / kwTotal) * 100);
    const ownCoverage = Math.round((ownCoveredKw / kwTotal) * 100);
    const authorityGap = Math.max(0, competitorCoverage - ownCoverage);

    let status: TopicCluster['status'] = 'Opportunity';
    if (ownCoverage > competitorCoverage && ownCoverage >= 60) {
      status = 'Dominating';
    } else if (Math.abs(ownCoverage - competitorCoverage) <= 15 && ownCoverage > 30) {
      status = 'Competitive';
    } else if (authorityGap >= 30 || (competitorCount > 0 && ownCount === 0)) {
      status = 'Urgent Gap';
    }

    // Map pages in cluster
    const pagesInCluster: TopicCluster['pagesInCluster'] = [];
    competitorPages.forEach(p => {
      if (competitorPageSet.has(p.metadata.url)) {
        pagesInCluster.push({
          url: p.metadata.url,
          title: p.metadata.title || p.metadata.h1 || 'Competitor Page',
          siteType: 'Competitor',
          role: p.category === 'service' ? 'Pillar Page' : 'Cluster Article'
        });
      }
    });

    ownPages.forEach(p => {
      if (ownPageSet.has(p.metadata.url)) {
        pagesInCluster.push({
          url: p.metadata.url,
          title: p.metadata.title || p.metadata.h1 || 'Own Page',
          siteType: 'Own Site',
          role: p.category === 'service' ? 'Pillar Page' : 'Cluster Article'
        });
      }
    });

    return {
      id: `cluster_${idx}_${pillar.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      pillarName: pillar.name,
      description: `Semantic cluster focusing on ${pillar.keywords.slice(0, 4).join(', ')} topics.`,
      totalVolume: totalVol,
      keywordsCount: clusterKeywords.length,
      keywords: clusterKeywords.map(k => k.term),
      competitorPageCount: competitorCount,
      ownPageCount: ownCount,
      competitorCoverageScore: competitorCoverage,
      ownCoverageScore: ownCoverage,
      authorityGapScore: authorityGap,
      status,
      pagesInCluster
    };
  });

  // Filter out clusters with zero keywords
  const activeClusters = clusters.filter(c => c.keywordsCount > 0 || c.competitorPageCount > 0 || c.ownPageCount > 0);

  // If no clusters matched standard pillars, create a dynamic fallback cluster
  if (activeClusters.length === 0) {
    activeClusters.push({
      id: 'cluster_general',
      pillarName: 'Core Service & Digital Marketing',
      description: 'General semantic topics identified across analyzed site pages.',
      totalVolume: allKeywords.reduce((sum, k) => sum + k.volume, 0),
      keywordsCount: allKeywords.length,
      keywords: allKeywords.map(k => k.term),
      competitorPageCount: competitorPages.length,
      ownPageCount: ownPages.length,
      competitorCoverageScore: 80,
      ownCoverageScore: 40,
      authorityGapScore: 40,
      status: 'Urgent Gap',
      pagesInCluster: [
        ...competitorPages.map(p => ({
          url: p.metadata.url,
          title: p.metadata.title || 'Competitor Page',
          siteType: 'Competitor' as const,
          role: 'Pillar Page' as const
        })),
        ...ownPages.map(p => ({
          url: p.metadata.url,
          title: p.metadata.title || 'Own Page',
          siteType: 'Own Site' as const,
          role: 'Pillar Page' as const
        }))
      ]
    });
  }

  return activeClusters.sort((a, b) => b.authorityGapScore - a.authorityGapScore);
}
