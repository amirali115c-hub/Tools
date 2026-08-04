import { PageMetadata, PageCategory, ClassifiedPage } from '../types';

const SERVICE_URL_PATTERNS = [
  '/service', '/services', '/solution', '/solutions', '/pricing', '/plans',
  '/capabilities', '/what-we-do', '/offering', '/offerings', '/product', '/products',
  '/features', '/platform', '/hire', '/agency', '/practice'
];

const BLOG_URL_PATTERNS = [
  '/blog', '/article', '/articles', '/insight', '/insights', '/resource', '/resources',
  '/news', '/guide', '/guides', '/post', '/posts', '/knowledge', '/hub', '/blog-post'
];

const DATED_URL_REGEX = /\/(20\d\d)\/(0[1-9]|1[0-2])\//;

const OTHER_URL_PATTERNS = [
  '/contact', '/about', '/privacy', '/terms', '/legal', '/team', '/careers', '/login', '/signup', '/faq'
];

/**
 * Classify page into Service, Blog, or Other with human-readable rationale
 */
export function classifyPage(metadata: PageMetadata, categoryOverride?: PageCategory): ClassifiedPage {
  if (categoryOverride) {
    return {
      metadata,
      category: categoryOverride,
      isManualOverride: true,
      classificationReason: `Manually set by user override`,
      secondaryKeywords: []
    };
  }

  const path = metadata.path.toLowerCase();
  const reasons: string[] = [];
  let category: PageCategory = 'other';

  const isServicePath = SERVICE_URL_PATTERNS.some(pat => path.includes(pat));
  const isBlogPath = BLOG_URL_PATTERNS.some(pat => path.includes(pat)) || DATED_URL_REGEX.test(path);
  const isOtherPath = OTHER_URL_PATTERNS.some(pat => path.includes(pat));

  // 1. Path Pattern Signal
  if (isServicePath) {
    reasons.push(`Matched URL pattern (e.g., /services/, /pricing/, /features/)`);
  } else if (isBlogPath) {
    reasons.push(`Matched Blog URL pattern (e.g., /blog/, /insights/, or dated path)`);
  } else if (isOtherPath) {
    reasons.push(`Matched Utility/Company path (e.g., /contact, /about, /terms)`);
  }

  // 2. Word Count & Content Shape Signal
  const wordCount = metadata.wordCount;
  if (wordCount > 0) {
    if (wordCount < 850 && metadata.ctaDensity !== 'none') {
      reasons.push(`Concise page structure (${wordCount} words) with CTA triggers`);
    } else if (wordCount > 1100) {
      reasons.push(`Longer editorial content length (${wordCount} words)`);
    } else {
      reasons.push(`Page length: ${wordCount} words`);
    }
  }

  // 3. CTA Density Signal
  if (metadata.ctaDensity === 'high') {
    reasons.push(`High commercial call-to-action density (${metadata.ctaMentions.length} CTA phrases)`);
  } else if (metadata.ctaDensity === 'medium') {
    reasons.push(`Moderate CTA triggers found`);
  }

  // Combine Signals to decide category
  if (isOtherPath) {
    category = 'other';
  } else if (isServicePath) {
    category = 'service';
  } else if (isBlogPath) {
    category = 'blog';
  } else {
    // Fallback to content shape
    if (metadata.ctaDensity === 'high' || (wordCount < 850 && metadata.ctaMentions.length > 0)) {
      category = 'service';
      reasons.push(`Inferred as Service page due to commercial intent & CTA signals`);
    } else if (wordCount > 1000) {
      category = 'blog';
      reasons.push(`Inferred as Blog/Article due to word count length (>1000 words)`);
    } else if (path === '/' || path === '') {
      category = 'other';
      reasons.push(`Homepage / Root domain`);
    } else {
      category = 'service'; // default assumption for custom landing pages
      reasons.push(`Defaulted to Service page for targeted landing page URL`);
    }
  }

  return {
    metadata,
    category,
    isManualOverride: false,
    classificationReason: reasons.join(' • '),
    secondaryKeywords: []
  };
}
