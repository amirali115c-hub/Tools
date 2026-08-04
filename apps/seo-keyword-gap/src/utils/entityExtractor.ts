import { ClassifiedPage, ExtractedEntity, SchemaMarkupOutput, EntityCategory, GapOpportunity } from '../types';

/**
 * Standard entity dictionary & patterns for high-precision Named Entity Recognition (NER)
 */
const ENTITY_DICTIONARY: { name: string; category: EntityCategory; synonyms: string[] }[] = [
  // Tech & Platforms
  { name: 'Google Search Console', category: 'Technology', synonyms: ['gsc', 'search console'] },
  { name: 'Google Analytics 4', category: 'Technology', synonyms: ['ga4', 'google analytics'] },
  { name: 'Shopify', category: 'Technology', synonyms: ['shopify plus', 'shopify store'] },
  { name: 'WordPress', category: 'Technology', synonyms: ['wp', 'wordpress.org'] },
  { name: 'HubSpot', category: 'Technology', synonyms: ['hubspot crm', 'hubspot cta'] },
  { name: 'Salesforce', category: 'Technology', synonyms: ['salesforce crm'] },
  { name: 'Semrush', category: 'Technology', synonyms: ['semrush api'] },
  { name: 'Ahrefs', category: 'Technology', synonyms: ['ahrefs DR'] },
  { name: 'BigQuery', category: 'Technology', synonyms: ['google bigquery'] },

  // Methodologies & Frameworks
  { name: 'TF-IDF Keyword Weighting', category: 'Methodology', synonyms: ['tf-idf', 'term frequency'] },
  { name: 'E-E-A-T Quality Guidelines', category: 'Methodology', synonyms: ['e-e-a-t', 'eeat', 'experience expertise'] },
  { name: 'Topical Authority Pillar Hubs', category: 'Methodology', synonyms: ['pillar page', 'topic cluster', 'hub and spoke'] },
  { name: 'Core Web Vitals Optimization', category: 'Methodology', synonyms: ['lcp', 'fid', 'cls', 'inp', 'pagespeed'] },
  { name: 'Conversion Rate Optimization', category: 'Methodology', synonyms: ['cro', 'ab testing', 'conversion rate'] },
  { name: 'AIDA Copywriting Framework', category: 'Methodology', synonyms: ['aida', 'attention interest desire action'] },

  // Industry Concepts
  { name: 'B2B SaaS Lead Generation', category: 'Industry Concept', synonyms: ['b2b saas', 'saas marketing'] },
  { name: 'Organic Search Traffic', category: 'Industry Concept', synonyms: ['organic traffic', 'seo traffic'] },
  { name: 'Keyword Cannibalization', category: 'Industry Concept', synonyms: ['cannibalization', 'keyword clash'] },
  { name: 'Schema Structured Data', category: 'Industry Concept', synonyms: ['json-ld', 'schema.org', 'microdata'] },
  { name: 'Search Engine Results Page', category: 'Industry Concept', synonyms: ['serp', 'google serp'] },

  // E-E-A-T Signals
  { name: 'Client Case Studies & ROI Results', category: 'E-E-A-T Signal', synonyms: ['case study', 'roi results', 'testimonials'] },
  { name: 'Verified Author Bio & Credentials', category: 'E-E-A-T Signal', synonyms: ['author bio', 'written by', 'reviewed by'] },
  { name: 'Transparent Pricing & Deliverables', category: 'E-E-A-T Signal', synonyms: ['pricing', 'plans', 'cost', 'packages'] },
  { name: 'ISO / Industry Certifications', category: 'E-E-A-T Signal', synonyms: ['certified', 'certification', 'google partner'] }
];

/**
 * Extract Named Entities across competitor and own site pages
 */
export function extractEntities(
  competitorPages: ClassifiedPage[],
  ownPages: ClassifiedPage[]
): ExtractedEntity[] {
  const entityMap = new Map<string, {
    entityName: string;
    category: EntityCategory;
    compMentions: number;
    ownMentions: number;
    compUrls: Set<string>;
    ownUrls: Set<string>;
  }>();

  // Initialize from dictionary
  ENTITY_DICTIONARY.forEach(e => {
    entityMap.set(e.name, {
      entityName: e.name,
      category: e.category,
      compMentions: 0,
      ownMentions: 0,
      compUrls: new Set(),
      ownUrls: new Set()
    });
  });

  // Helper to scan text
  const scanPages = (pages: ClassifiedPage[], siteType: 'Competitor' | 'Own Site') => {
    pages.forEach(p => {
      const fullText = `${p.metadata.title} ${p.metadata.h1} ${p.metadata.h2s.join(' ')} ${p.metadata.metaDescription} ${p.metadata.bodyText}`.toLowerCase();

      ENTITY_DICTIONARY.forEach(e => {
        const matches = e.synonyms.some(syn => fullText.includes(syn.toLowerCase())) || fullText.includes(e.name.toLowerCase());
        if (matches) {
          const item = entityMap.get(e.name)!;
          if (siteType === 'Competitor') {
            item.compMentions += 1;
            item.compUrls.add(p.metadata.url);
          } else {
            item.ownMentions += 1;
            item.ownUrls.add(p.metadata.url);
          }
        }
      });
    });
  };

  scanPages(competitorPages, 'Competitor');
  scanPages(ownPages, 'Own Site');

  return Array.from(entityMap.values()).map((e, idx) => {
    const isMissing = e.compMentions > 0 && e.ownMentions === 0;
    const total = e.compMentions + e.ownMentions || 1;
    const relevance = Math.min(100, Math.round((e.compMentions * 25) + (e.ownMentions * 15)));

    return {
      id: `entity_${idx}`,
      entityName: e.entityName,
      category: e.category,
      competitorMentions: e.compMentions,
      ownMentions: e.ownMentions,
      isMissingInOwnSite: isMissing,
      relevanceScore: relevance,
      recommendedSchemaType: e.category === 'Technology' ? 'SoftwareApplication' : e.category === 'Organization' ? 'Organization' : 'DefinedTerm',
      sampleSourceUrls: Array.from(e.compUrls).slice(0, 3)
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Generate JSON-LD Schema Markup tailored to a specific page or gap brief
 */
export function generateSchemaMarkup(
  pageTitle: string,
  pageUrl: string,
  category: 'service' | 'blog' | 'other',
  primaryKeyword: string,
  entities: string[] = [],
  description: string = ''
): SchemaMarkupOutput {
  const cleanUrl = pageUrl.startsWith('http') ? pageUrl : `https://example.com${pageUrl}`;
  const cleanDesc = description || `${pageTitle} - Comprehensive strategy, expert analysis, and solutions for ${primaryKeyword}.`;

  let schemaType: SchemaMarkupOutput['schemaType'] = category === 'service' ? 'Service' : 'Article';
  let jsonLd: Record<string, any> = {};

  if (category === 'service') {
    schemaType = 'Service';
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'name': pageTitle,
      'serviceType': primaryKeyword,
      'description': cleanDesc,
      'provider': {
        '@type': 'Organization',
        'name': 'Your Brand Name',
        'url': 'https://example.com'
      },
      'areaServed': 'Worldwide',
      'hasOfferCatalog': {
        '@type': 'OfferCatalog',
        'name': `${primaryKeyword} Services`,
        'itemListElement': [
          {
            '@type': 'Offer',
            'itemOffered': {
              '@type': 'Service',
              'name': `Professional ${primaryKeyword}`
            }
          }
        ]
      },
      'knowsAbout': entities.slice(0, 5)
    };
  } else {
    schemaType = 'Article';
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      'headline': pageTitle,
      'description': cleanDesc,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': cleanUrl
      },
      'author': {
        '@type': 'Organization',
        'name': 'SEO Editorial Team',
        'url': 'https://example.com/about'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Your Brand Name',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://example.com/logo.png'
        }
      },
      'about': entities.slice(0, 5).map(e => ({ '@type': 'Thing', 'name': e })),
      'keywords': [primaryKeyword, ...entities.slice(0, 3)].join(', ')
    };
  }

  return {
    pageUrl: cleanUrl,
    pageTitle,
    schemaType,
    jsonLd,
    formattedJson: JSON.stringify(jsonLd, null, 2)
  };
}
