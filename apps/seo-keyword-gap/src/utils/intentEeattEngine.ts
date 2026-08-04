import { ClassifiedPage, SerpIntentDistribution, EeattAuditResult, EeattSignal, ComprehensiveBrief, GapOpportunity } from '../types';
import { generateSchemaMarkup } from './entityExtractor';

/**
 * Classify keyword search intent based on semantic modifiers
 */
export function classifySearchIntent(keyword: string): 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' {
  const kw = keyword.toLowerCase();

  const transactionalWords = ['buy', 'quote', 'hire', 'pricing', 'cost', 'price', 'plan', 'agency', 'service', 'services', 'contact', 'demo', 'order'];
  const commercialWords = ['best', 'top', 'vs', 'comparison', 'review', 'reviews', 'software', 'platform', 'tool', 'tools', 'alternative'];
  const informationalWords = ['how', 'what', 'why', 'guide', 'tutorial', 'tips', 'checklist', 'example', 'examples', 'strategy', 'template', 'audit'];

  if (transactionalWords.some(w => kw.includes(w))) return 'Transactional';
  if (commercialWords.some(w => kw.includes(w))) return 'Commercial';
  if (informationalWords.some(w => kw.includes(w))) return 'Informational';

  return 'Informational';
}

/**
 * Compute overall Search Intent distribution across all pages
 */
export function calculateSerpIntentDistribution(pages: ClassifiedPage[]): SerpIntentDistribution[] {
  const counts = {
    Informational: 0,
    Commercial: 0,
    Transactional: 0,
    Navigational: 0
  };

  pages.forEach(p => {
    const kw = p.primaryKeyword?.term || p.metadata.title;
    const intent = classifySearchIntent(kw);
    counts[intent]++;
  });

  const total = pages.length || 1;

  return [
    { intent: 'Transactional', count: counts.Transactional, percentage: Math.round((counts.Transactional / total) * 100), color: '#10b981' },
    { intent: 'Commercial', count: counts.Commercial, percentage: Math.round((counts.Commercial / total) * 100), color: '#6366f1' },
    { intent: 'Informational', count: counts.Informational, percentage: Math.round((counts.Informational / total) * 100), color: '#f59e0b' },
    { intent: 'Navigational', count: counts.Navigational, percentage: Math.round((counts.Navigational / total) * 100), color: '#3b82f6' }
  ];
}

/**
 * Perform E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) Audit on a page
 */
export function auditEeattQuality(page: ClassifiedPage): EeattAuditResult {
  const body = page.metadata.bodyText.toLowerCase();
  const title = page.metadata.title.toLowerCase();

  const signals: EeattSignal[] = [
    // Experience
    {
      category: 'Experience',
      signalName: 'First-Hand Case Studies & Case Results',
      status: body.includes('case study') || body.includes('results') || body.includes('client') ? 'Present' : 'Missing',
      recommendation: 'Add real-world client metrics, before/after ROI charts, or video testimonials.',
      weight: 25
    },
    // Expertise
    {
      category: 'Expertise',
      signalName: 'Author Credentials & Expert Attribution',
      status: body.includes('author') || body.includes('written by') || body.includes('expert') ? 'Present' : 'Needs Enhancement',
      recommendation: 'Include explicit author bio with industry credentials, LinkedIn profile, and reviewer disclosures.',
      weight: 25
    },
    // Authoritativeness
    {
      category: 'Authoritativeness',
      signalName: 'Data Citations & Standard References',
      status: page.metadata.internalLinkAnchors.length > 2 || body.includes('data') || body.includes('report') ? 'Present' : 'Needs Enhancement',
      recommendation: 'Cite authoritative industry statistics, ISO standards, or original benchmark research.',
      weight: 25
    },
    // Trustworthiness
    {
      category: 'Trustworthiness',
      signalName: 'Clear Pricing, Contact & Policy Transparency',
      status: page.metadata.ctaMentions.length > 0 || body.includes('contact') || body.includes('privacy') ? 'Present' : 'Missing',
      recommendation: 'Include clear contact methods, pricing structures, and privacy policy links.',
      weight: 25
    }
  ];

  const presentCount = signals.filter(s => s.status === 'Present').length;
  const overallScore = Math.round((presentCount / signals.length) * 100);

  return {
    pageUrl: page.metadata.url,
    pageTitle: page.metadata.title || page.metadata.h1 || 'Page',
    overallScore,
    experienceScore: signals[0].status === 'Present' ? 90 : 40,
    expertiseScore: signals[1].status === 'Present' ? 95 : 50,
    authoritativenessScore: signals[2].status === 'Present' ? 85 : 45,
    trustworthinessScore: signals[3].status === 'Present' ? 100 : 60,
    signals
  };
}

/**
 * Generate a ready-to-publish Copywriter Brief for a Gap or Existing Page
 */
export function generateComprehensiveBrief(gap: GapOpportunity): ComprehensiveBrief {
  const intent = classifySearchIntent(gap.targetPrimaryKeyword);
  const schema = generateSchemaMarkup(gap.workingTitle, `/services/${gap.suggestedSlug}`, gap.suggestedPageType, gap.targetPrimaryKeyword, gap.targetSecondaryKeywords, gap.reasoning);

  return {
    id: `brief_${gap.id}`,
    title: gap.workingTitle,
    targetSlug: gap.suggestedSlug,
    primaryKeyword: gap.targetPrimaryKeyword,
    secondaryKeywords: gap.targetSecondaryKeywords,
    intent,
    suggestedWordCount: { min: 1400, target: 1800, max: 2400 },
    topicCluster: gap.suggestedPageType === 'service' ? 'Service Pillars' : 'Topic Cluster Guides',
    targetEntities: [
      gap.targetPrimaryKeyword,
      'E-E-A-T Credentials',
      'Case Study ROI Results',
      'TF-IDF Optimization',
      ...gap.targetSecondaryKeywords.slice(0, 3)
    ],
    outline: [
      { headingType: 'H1', text: gap.workingTitle, guidance: `Primary Target Keyword "${gap.targetPrimaryKeyword}" included naturally in H1.` },
      { headingType: 'H2', text: `Executive Overview & Strategic Benefits`, guidance: 'State core problem solved, target audience, and key value proposition in first 100 words.' },
      { headingType: 'H2', text: `Core Deliverables & Methodologies`, guidance: `Integrate secondary keywords (${gap.targetSecondaryKeywords.join(', ')}) with bulleted sub-points.` },
      { headingType: 'H2', text: `Client Case Study & Proven Results`, guidance: 'E-E-A-T requirement: Include real ROI data, timelines, and measurable traffic/lead growth.' },
      { headingType: 'H3', text: `Step-by-Step Implementation Framework`, guidance: 'Numbered step-by-step process with actionable instructions.' },
      { headingType: 'H2', text: `Frequently Asked Questions`, guidance: 'Include FAQPage Schema targets for high-volume conversational search queries.' }
    ],
    eeattRequirements: [
      'Include author bio & credentials at the top or bottom of the page.',
      'Embed 1 real client case study with specific performance percentages.',
      'Include transparent service pricing or consultation booking CTA buttons.',
      'Add internal links to related topic pillar pages with contextual anchor text.'
    ],
    internalLinksToInclude: [
      { anchor: 'SEO Strategy Overview', targetUrl: '/services/seo-strategy' },
      { anchor: 'Content Marketing Framework', targetUrl: '/blog/content-framework' }
    ],
    schemaMarkup: schema.jsonLd
  };
}
