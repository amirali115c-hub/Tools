import Papa from 'papaparse';
import { PageMetadata, KeywordVolumeItem } from '../types';

// Common English Stopwords
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot',
  'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
  'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s',
  'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
  'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d',
  'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s',
  'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you',
  'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves', 'com', 'http', 'https',
  'www', 'click', 'page', 'home', 'website', 'rights', 'reserved', 'copyright', 'privacy', 'policy', 'terms'
]);

const CTA_KEYWORDS = [
  'get a quote', 'request a quote', 'contact us', 'buy now', 'pricing', 'order now',
  'schedule a demo', 'book a call', 'free trial', 'get started', 'sign up', 'call us',
  'talk to an expert', 'consultation', 'add to cart', 'claim offer', 'hire us'
];

/**
 * Normalizes a URL and extracts path
 */
export function extractPathFromUrl(urlStr: string, defaultDomain = ''): { url: string; path: string } {
  let cleanUrl = urlStr.trim();
  if (!cleanUrl) return { url: '', path: '/' };
  
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  try {
    const parsed = new URL(cleanUrl);
    return {
      url: parsed.href,
      path: parsed.pathname || '/'
    };
  } catch {
    // If URL parsing fails, clean manually
    const parts = cleanUrl.split('/');
    const path = parts.length > 3 ? '/' + parts.slice(3).join('/') : '/';
    return { url: cleanUrl, path };
  }
}

/**
 * Parse raw HTML using DOMParser
 */
export function parsePageHtml(rawHtml: string, pageUrl: string): PageMetadata {
  const { url, path } = extractPathFromUrl(pageUrl);
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Title
  const title = doc.querySelector('title')?.textContent?.trim() || '';

  // Meta Description
  const metaDescElem = doc.querySelector('meta[name="description"]') || doc.querySelector('meta[property="og:description"]');
  const metaDescription = metaDescElem?.getAttribute('content')?.trim() || '';

  // Headings
  const h1Elem = doc.querySelector('h1');
  const h1 = h1Elem?.textContent?.trim() || '';

  const h2s: string[] = Array.from(doc.querySelectorAll('h2'))
    .map(el => el.textContent?.trim() || '')
    .filter(Boolean);

  const h3s: string[] = Array.from(doc.querySelectorAll('h3'))
    .map(el => el.textContent?.trim() || '')
    .filter(Boolean);

  // Image Alts
  const imageAlts: string[] = Array.from(doc.querySelectorAll('img'))
    .map(img => img.getAttribute('alt')?.trim() || '')
    .filter(Boolean);

  // Internal Link Anchors
  const internalLinkAnchors: string[] = Array.from(doc.querySelectorAll('a'))
    .map(a => a.textContent?.trim() || '')
    .filter(anchor => anchor.length > 2 && anchor.length < 80);

  // Strip script, style, nav, footer, header for body copy extraction
  const cloneDoc = doc.cloneNode(true) as Document;
  cloneDoc.querySelectorAll('script, style, noscript, svg, nav, footer, iframe').forEach(el => el.remove());

  const bodyText = cloneDoc.body ? cloneDoc.body.textContent || '' : '';
  const cleanedBodyText = bodyText.replace(/\s+/g, ' ').trim();
  const words = cleanedBodyText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  const first150Words = words.slice(0, 150).join(' ');

  // CTA Signal Detection
  const lowerBody = cleanedBodyText.toLowerCase();
  const ctaMentions = CTA_KEYWORDS.filter(cta => lowerBody.includes(cta));
  let ctaDensity: 'high' | 'medium' | 'low' | 'none' = 'none';
  if (ctaMentions.length >= 3) ctaDensity = 'high';
  else if (ctaMentions.length >= 1) ctaDensity = 'medium';
  else if (doc.querySelectorAll('button, input[type="submit"], form').length > 0) ctaDensity = 'low';

  const isSpaOrEmpty = wordCount < 35 || (!title && !h1);

  return {
    id: `page_${Math.random().toString(36).substr(2, 9)}`,
    url: url || pageUrl,
    path,
    title,
    h1,
    h2s,
    h3s,
    metaDescription,
    first150Words,
    bodyText: cleanedBodyText,
    wordCount,
    imageAlts,
    internalLinkAnchors,
    ctaMentions,
    ctaDensity,
    isSpaOrEmpty,
    rawHtml,
    sourceType: 'html_paste'
  };
}

/**
 * Creates page metadata from a single URL string by extracting clean titles and terms from the path slug
 */
export function createMetadataFromUrl(rawUrlString: string, sourceType: 'sitemap_xml' | 'url_list' = 'url_list'): PageMetadata {
  const { url, path } = extractPathFromUrl(rawUrlString);
  
  // Extract path segments
  const segments = path.split('/').filter(s => s && s !== 'index.html' && s !== 'index.php');
  const lastSegment = segments[segments.length - 1] || 'Home Page';

  // Convert slug to Title case (e.g., 'b2b-saas-marketing' -> 'B2B SaaS Marketing')
  const formattedSlug = lastSegment
    .replace(/[-_]/g, ' ')
    .replace(/\.html?$/i, '')
    .replace(/\b[a-z]/g, letter => letter.toUpperCase());

  const categoryPrefix = segments.length > 1 ? segments[0].toLowerCase() : '';
  let inferredH1 = formattedSlug;
  if (categoryPrefix === 'services' || categoryPrefix === 'service' || categoryPrefix === 'solutions') {
    inferredH1 = `${formattedSlug} Services`;
  } else if (categoryPrefix === 'blog' || categoryPrefix === 'articles' || categoryPrefix === 'resources') {
    inferredH1 = `${formattedSlug} Guide`;
  }

  const syntheticBody = `${inferredH1}. ${formattedSlug} overview and strategy. ${segments.join(' ')} ${formattedSlug.toLowerCase()}`;
  const words = syntheticBody.split(/\s+/).filter(Boolean);

  return {
    id: `url_${Math.random().toString(36).substr(2, 9)}`,
    url: url || rawUrlString,
    path,
    title: formattedSlug,
    h1: inferredH1,
    h2s: [formattedSlug],
    h3s: [],
    metaDescription: `${formattedSlug} - ${inferredH1} overview.`,
    first150Words: syntheticBody,
    bodyText: syntheticBody,
    wordCount: words.length,
    imageAlts: [],
    internalLinkAnchors: [],
    ctaMentions: categoryPrefix === 'services' ? ['get a quote', 'contact us'] : [],
    ctaDensity: categoryPrefix === 'services' ? 'medium' : 'none',
    isSpaOrEmpty: false,
    sourceType
  };
}

/**
 * Parses a newline or space-separated list of URLs into PageMetadata items
 */
export function parseUrlList(urlListText: string, sourceType: 'sitemap_xml' | 'url_list' = 'url_list'): PageMetadata[] {
  if (!urlListText.trim()) return [];
  
  // Split by newlines, commas, or spaces
  const lines = urlListText.split(/[\n,\r]+/).map(l => l.trim()).filter(Boolean);
  const validUrls = lines.filter(l => l.startsWith('http://') || l.startsWith('https://') || l.includes('.com') || l.includes('.io') || l.includes('/'));

  const unique = Array.from(new Set(validUrls));
  return unique.map(u => createMetadataFromUrl(u, sourceType));
}

/**
 * Parse Sitemap XML content to extract URLs and convert directly to PageMetadata
 */
export function parseSitemapXml(sitemapContent: string): PageMetadata[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(sitemapContent, 'text/xml');
  const locElements = xmlDoc.querySelectorAll('loc');
  const urls: string[] = [];
  locElements.forEach(loc => {
    const text = loc.textContent?.trim();
    if (text) urls.push(text);
  });

  // Fallback regex if DOMParser fails or text/xml wasn't perfect
  if (urls.length === 0) {
    const urlMatches = sitemapContent.match(/https?:\/\/[^\s<"']+/g);
    if (urlMatches) {
      urls.push(...urlMatches);
    }
  }

  const uniqueUrls = Array.from(new Set(urls));
  return uniqueUrls.map(u => createMetadataFromUrl(u, 'sitemap_xml'));
}

/**
 * Parse CSV File upload for site pages
 */
export function parsePagesCsv(csvFile: File | string): Promise<{ pages: PageMetadata[]; warnings: string[] }> {
  return new Promise((resolve, reject) => {
    const warnings: string[] = [];

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        if (!rows || rows.length === 0) {
          return resolve({ pages: [], warnings: ['CSV file appears to be empty.'] });
        }

        const sampleKeys = Object.keys(rows[0]).map(k => k.trim());
        const findCol = (candidates: string[]) => {
          return sampleKeys.find(k => candidates.some(c => k.toLowerCase() === c.toLowerCase() || k.toLowerCase().includes(c.toLowerCase())));
        };

        const urlCol = findCol(['url', 'address', 'loc', 'page url']);
        const titleCol = findCol(['title', 'title 1', 'meta title', 'page title']);
        const h1Col = findCol(['h1', 'h1-1', 'heading 1', 'h1 title']);
        const metaCol = findCol(['meta description', 'description', 'meta desc', 'description 1']);
        const wordCountCol = findCol(['word count', 'words', 'wordcount']);
        const bodyCol = findCol(['body', 'content', 'text', 'first 150 words']);

        if (!urlCol) {
          warnings.push('Could not auto-detect a "URL" column. Checked candidates: URL, Address, Page URL.');
        }

        const pages: PageMetadata[] = rows.map((row, idx) => {
          const rawUrl = urlCol ? row[urlCol] || `https://example.com/page-${idx + 1}` : `https://example.com/page-${idx + 1}`;
          const { url, path } = extractPathFromUrl(rawUrl);

          const title = titleCol ? (row[titleCol] || '').trim() : '';
          const h1 = h1Col ? (row[h1Col] || '').trim() : '';
          const metaDescription = metaCol ? (row[metaCol] || '').trim() : '';
          const bodyText = bodyCol ? (row[bodyCol] || '').trim() : `${title}. ${h1}. ${metaDescription}`;
          
          let wordCount = 0;
          if (wordCountCol && row[wordCountCol]) {
            wordCount = parseInt(row[wordCountCol].replace(/[^\d]/g, ''), 10) || 0;
          }
          if (!wordCount) {
            wordCount = bodyText.split(/\s+/).filter(Boolean).length;
          }

          const first150Words = bodyText.split(/\s+/).slice(0, 150).join(' ');

          const lowerBody = bodyText.toLowerCase();
          const ctaMentions = CTA_KEYWORDS.filter(cta => lowerBody.includes(cta));
          let ctaDensity: 'high' | 'medium' | 'low' | 'none' = 'none';
          if (ctaMentions.length >= 3) ctaDensity = 'high';
          else if (ctaMentions.length >= 1) ctaDensity = 'medium';

          const isSpaOrEmpty = wordCount < 30 || (!title && !h1);

          return {
            id: `csv_page_${idx}_${Math.random().toString(36).substr(2, 6)}`,
            url,
            path,
            title,
            h1,
            h2s: [],
            h3s: [],
            metaDescription,
            first150Words,
            bodyText,
            wordCount,
            imageAlts: [],
            internalLinkAnchors: [],
            ctaMentions,
            ctaDensity,
            isSpaOrEmpty,
            sourceType: 'csv_upload'
          };
        });

        resolve({ pages, warnings });
      },
      error: (err) => reject(err)
    });
  });
}

/**
 * Parse Keyword Volume CSV data
 */
export function parseVolumeCsv(csvContent: File | string): Promise<KeywordVolumeItem[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        if (!rows || rows.length === 0) return resolve([]);

        const sampleKeys = Object.keys(rows[0]).map(k => k.trim().toLowerCase());
        const findColName = (candidates: string[]) => {
          return Object.keys(rows[0]).find(k => candidates.includes(k.trim().toLowerCase()));
        };

        const kwCol = findColName(['keyword', 'term', 'search term', 'query', 'keywords']);
        const volCol = findColName(['volume', 'search volume', 'monthly searches', 'vol']);
        const cpcCol = findColName(['cpc', 'cost per click']);
        const compCol = findColName(['competition', 'cmp', 'difficulty']);

        if (!kwCol) {
          return resolve([]);
        }

        const volumeList: KeywordVolumeItem[] = [];
        rows.forEach(r => {
          const kw = (r[kwCol] || '').trim().toLowerCase();
          if (!kw) return;

          const rawVol = volCol ? r[volCol] : '0';
          const volume = parseInt(rawVol.replace(/[^\d]/g, ''), 10) || 0;

          const rawCpc = cpcCol ? parseFloat(r[cpcCol].replace(/[^\d.]/g, '')) : undefined;
          const rawComp = compCol ? r[compCol] : undefined;

          volumeList.push({
            keyword: kw,
            volume,
            cpc: isNaN(rawCpc!) ? undefined : rawCpc,
            competition: rawComp
          });
        });

        resolve(volumeList);
      },
      error: (err) => reject(err)
    });
  });
}

/**
 * Clean & tokenize text into n-grams (1 to 4 words)
 */
export function extractNGrams(text: string): { ngram: string; count: number }[] {
  if (!text) return [];

  const cleanText = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleanText.split(' ').filter(w => w.length > 2 && !STOPWORDS.has(w));
  const counts: Record<string, number> = {};

  // 1-grams to 4-grams
  for (let n = 1; n <= 4; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const slice = words.slice(i, i + n);
      // Ensure ngram doesn't start or end with bad stopwords
      const gram = slice.join(' ');
      if (gram.length < 3) continue;

      counts[gram] = (counts[gram] || 0) + (n > 1 ? 1.5 : 1.0);
    }
  }

  return Object.entries(counts).map(([ngram, count]) => ({ ngram, count }));
}
