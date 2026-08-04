import { ClassifiedPage, PlacementChecklist, PlacementItem } from '../types';

/**
 * Generates an evaluation checklist of keyword placement for an existing page
 */
export function generatePlacementChecklist(page: ClassifiedPage): PlacementChecklist {
  const primaryKw = page.primaryKeyword?.term || '';
  const secondaryKws = page.secondaryKeywords.map(k => k.term);
  const meta = page.metadata;

  const kwLower = primaryKw.toLowerCase().trim();
  const kwWords = kwLower.split(/\s+/).filter(Boolean);

  const checkContainsKw = (text: string): boolean => {
    if (!text || !kwLower) return false;
    const lowerText = text.toLowerCase();
    if (lowerText.includes(kwLower)) return true;
    // Check if majority of key words are present
    if (kwWords.length > 1) {
      const matchCount = kwWords.filter(w => lowerText.includes(w)).length;
      return matchCount >= Math.ceil(kwWords.length * 0.75);
    }
    return false;
  };

  const items: PlacementItem[] = [];

  // 1. Title Tag
  const titleMatch = checkContainsKw(meta.title);
  items.push({
    element: 'Title Tag',
    status: titleMatch ? 'passed' : 'failed',
    currentText: meta.title || '(No <title> tag found)',
    recommendation: titleMatch
      ? `Title tag contains target keyword "${primaryKw}".`
      : `Add "${primaryKw}" near the front of the <title> tag (e.g. "${primaryKw} | Brand"). Current: "${meta.title || 'Missing'}"`,
    importance: 'critical'
  });

  // 2. H1 Heading
  const h1Match = checkContainsKw(meta.h1);
  items.push({
    element: 'H1 Heading',
    status: h1Match ? 'passed' : 'failed',
    currentText: meta.h1 || '(No <h1> tag found)',
    recommendation: h1Match
      ? `H1 heading features target keyword.`
      : `Ensure the main <h1> heading includes exact or close variant of "${primaryKw}". Current H1: "${meta.h1 || 'Missing'}"`,
    importance: 'critical'
  });

  // 3. URL Slug
  const slugMatch = checkContainsKw(meta.path);
  items.push({
    element: 'URL Slug',
    status: slugMatch ? 'passed' : 'failed',
    currentText: meta.path,
    recommendation: slugMatch
      ? `URL path contains target keyword.`
      : `Consider updating or redirecting URL slug to include "${primaryKw.replace(/\s+/g, '-')}". Current path: ${meta.path}`,
    importance: 'high'
  });

  // 4. First 100 Words
  const bodyStartMatch = checkContainsKw(meta.first150Words);
  items.push({
    element: 'First 100 Words',
    status: bodyStartMatch ? 'passed' : 'failed',
    currentText: meta.first150Words ? `${meta.first150Words.slice(0, 100)}...` : '(No body text found)',
    recommendation: bodyStartMatch
      ? `Target keyword appears early in opening body copy.`
      : `Incorporate "${primaryKw}" naturally within the first 1-2 sentences of body copy.`,
    importance: 'high'
  });

  // 5. Image Alt Text
  const imgMatch = meta.imageAlts.some(alt => checkContainsKw(alt));
  items.push({
    element: 'Image Alt Text',
    status: imgMatch ? 'passed' : 'failed',
    currentText: meta.imageAlts.length > 0 ? meta.imageAlts.slice(0, 3).join('; ') : '(No image alt text found)',
    recommendation: imgMatch
      ? `At least 1 image alt attribute contains target keyword.`
      : `Add an image with descriptive alt text containing "${primaryKw}" or a secondary keyword.`,
    importance: 'medium'
  });

  // 6. Internal Link Anchor Text
  const anchorMatch = meta.internalLinkAnchors.some(anchor => checkContainsKw(anchor));
  items.push({
    element: 'Internal Link Anchor',
    status: anchorMatch ? 'passed' : 'failed',
    currentText: meta.internalLinkAnchors.length > 0 ? meta.internalLinkAnchors.slice(0, 3).join('; ') : '(No internal links evaluated)',
    recommendation: anchorMatch
      ? `Internal links pointing to/from this page use keyword-rich anchor text.`
      : `Build 2-3 internal links from related site pages pointing here using anchor text "${primaryKw}".`,
    importance: 'medium'
  });

  const passedCount = items.filter(i => i.status === 'passed').length;
  const scorePercent = Math.round((passedCount / items.length) * 100);

  return {
    pageId: meta.id,
    url: meta.url,
    pageType: page.category,
    targetPrimaryKeyword: primaryKw || 'Unassigned',
    targetSecondaryKeywords: secondaryKws,
    items,
    scorePercent
  };
}
