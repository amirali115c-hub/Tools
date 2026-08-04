import { ClassifiedPage, ExtractedKeyword, KeywordVolumeItem } from '../types';
import { extractNGrams } from './parser';

/**
 * Calculates weighted TF-IDF for each page in a site collection
 */
export function processSiteKeywords(
  pages: ClassifiedPage[],
  volumeMap: Map<string, KeywordVolumeItem> = new Map(),
  seedKeywords: string[] = []
): ClassifiedPage[] {
  if (!pages || pages.length === 0) return pages;

  const totalPages = pages.length;
  const useSimpleFrequencyFallback = totalPages < 4;

  // 1. Build document frequency (DF) for every n-gram term across all pages
  const documentFrequency: Record<string, number> = {};
  const pageTermMaps: Map<string, Map<string, { weightedFreq: number; sources: Set<string> }>> = new Map();

  pages.forEach(page => {
    const meta = page.metadata;
    const termMap = new Map<string, { weightedFreq: number; sources: Set<string> }>();

    const addText = (text: string, weight: number, sourceName: string) => {
      if (!text) return;
      const ngrams = extractNGrams(text);
      ngrams.forEach(({ ngram, count }) => {
        const existing = termMap.get(ngram) || { weightedFreq: 0, sources: new Set() };
        existing.weightedFreq += count * weight;
        existing.sources.add(sourceName);
        termMap.set(ngram, existing);
      });
    };

    // Apply Field Weights
    addText(meta.title, 4.0, 'Title');
    addText(meta.h1, 3.5, 'H1');
    addText(meta.metaDescription, 2.5, 'Meta Description');
    addText(meta.h2s.join(' '), 2.0, 'H2 Headings');
    addText(meta.h3s.join(' '), 1.5, 'H3 Headings');
    addText(meta.first150Words, 1.5, 'First 150 Words');
    addText(meta.bodyText, 1.0, 'Body Text');

    pageTermMaps.set(meta.id, termMap);

    // Track DF (document frequency)
    termMap.forEach((_, term) => {
      documentFrequency[term] = (documentFrequency[term] || 0) + 1;
    });
  });

  // 2. Compute TF-IDF or Weighted Frequency for each page
  return pages.map(page => {
    const termMap = pageTermMaps.get(page.metadata.id);
    if (!termMap) return page;

    const extractedList: ExtractedKeyword[] = [];

    termMap.forEach(({ weightedFreq, sources }, term) => {
      if (term.length < 3) return;

      const df = documentFrequency[term] || 1;
      let score = 0;

      if (useSimpleFrequencyFallback) {
        score = weightedFreq;
      } else {
        const tf = Math.log(1 + weightedFreq);
        const idf = Math.log(totalPages / (1 + df)) + 1;
        score = tf * idf;
      }

      const isSeedMatch = seedKeywords.some(sk => term.includes(sk.toLowerCase()) || sk.toLowerCase().includes(term));
      if (isSeedMatch) {
        score *= 1.4;
      }

      const volumeItem = volumeMap.get(term.toLowerCase());
      const isVolumeBacked = !!volumeItem && volumeItem.volume > 0;
      let finalVolume: number | undefined = undefined;

      if (volumeItem && volumeItem.volume > 0) {
        finalVolume = volumeItem.volume;
        const volMultiplier = 1 + Math.log10(volumeItem.volume + 1) * 0.25;
        score *= volMultiplier;
      }

      extractedList.push({
        term,
        score,
        frequency: Math.round(weightedFreq),
        isVolumeBacked,
        volume: finalVolume,
        sourceFields: Array.from(sources)
      });
    });

    extractedList.sort((a, b) => b.score - a.score);

    const deduplicatedKeywords: ExtractedKeyword[] = [];
    extractedList.forEach(item => {
      const isSubFragment = deduplicatedKeywords.some(
        existing => existing.term !== item.term && existing.term.includes(item.term) && existing.score >= item.score * 0.8
      );
      if (!isSubFragment) {
        deduplicatedKeywords.push(item);
      }
    });

    const primaryKeyword = deduplicatedKeywords[0];
    const secondaryKeywords = deduplicatedKeywords.slice(1, 4);

    return {
      ...page,
      primaryKeyword,
      secondaryKeywords
    };
  });
}
