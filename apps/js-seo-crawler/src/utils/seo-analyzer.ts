import {MetaTag, HeadingTag, LinkInfo, ImageInfo, SchemaOrgData, OpenGraphTags, TwitterCardTags, SEOIssue} from '../types';

export function parseHTML(html: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc;
}

export function extractMetaTags(doc: Document): MetaTag[] {
  const metas = doc.querySelectorAll('meta');
  return Array.from(metas).map((meta) => ({
    name: meta.getAttribute('name') || undefined,
    property: meta.getAttribute('property') || undefined,
    content: meta.getAttribute('content') || undefined,
    httpEquiv: meta.getAttribute('http-equiv') || undefined,
    charset: meta.getAttribute('charset') || undefined,
  }));
}

export function extractTitle(doc: Document): string {
  const title = doc.querySelector('title');
  return title?.textContent?.trim() || '';
}

export function extractMetaDescription(doc: Document): string {
  const meta = doc.querySelector('meta[name="description"]');
  return meta?.getAttribute('content') || '';
}

export function extractCanonical(doc: Document): string {
  const link = doc.querySelector('link[rel="canonical"]');
  return link?.getAttribute('href') || '';
}

export function extractRobots(doc: Document): string {
  const meta = doc.querySelector('meta[name="robots"]');
  return meta?.getAttribute('content') || '';
}

export function extractHeadings(doc: Document): HeadingTag[] {
  const headings: HeadingTag[] = [];
  const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headingElements.forEach((el, index) => {
    const level = parseInt(el.tagName.substring(1));
    headings.push({
      level,
      text: el.textContent?.trim() || '',
      index,
    });
  });
  return headings;
}

export function extractLinks(doc: Document, baseUrl: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const linkElements = doc.querySelectorAll('a[href]');
  const url = new URL(baseUrl);

  linkElements.forEach((el, index) => {
    const href = el.getAttribute('href') || '';
    let isInternal = false;

    try {
      const linkUrl = new URL(href, baseUrl);
      isInternal = linkUrl.hostname === url.hostname;
    } catch {
      isInternal = href.startsWith('/') || href.startsWith('#') || href.startsWith('.');
    }

    links.push({
      href,
      text: el.textContent?.trim() || '',
      isInternal,
      rel: el.getAttribute('rel') || undefined,
      index,
    });
  });

  return links;
}

export function extractImages(doc: Document, baseUrl: string): ImageInfo[] {
  const images: ImageInfo[] = [];
  const imgElements = doc.querySelectorAll('img');

  imgElements.forEach((el, index) => {
    const src = el.getAttribute('src') || '';
    const alt = el.getAttribute('alt') || '';

    images.push({
      src,
      alt,
      hasAlt: alt.length > 0,
      width: el.getAttribute('width') || undefined,
      height: el.getAttribute('height') || undefined,
      index,
    });
  });

  return images;
}

export function extractSchemaOrg(doc: Document): SchemaOrgData[] {
  const schemas: SchemaOrgData[] = [];
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

  scripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || '');
      const type = data['@type'] || 'Unknown';
      const errors: string[] = [];

      if (!data['@context']) {
        errors.push('Missing @context property');
      }
      if (!data['@type']) {
        errors.push('Missing @type property');
      }

      schemas.push({
        type,
        data,
        isValid: errors.length === 0,
        errors,
      });
    } catch {
      schemas.push({
        type: 'Invalid JSON-LD',
        data: {},
        isValid: false,
        errors: ['Invalid JSON-LD syntax'],
      });
    }
  });

  return schemas;
}

export function extractOpenGraph(doc: Document): OpenGraphTags {
  const og: OpenGraphTags = {
    missing: [],
  };

  const ogTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:site_name', 'og:locale'];

  ogTags.forEach((tag) => {
    const meta = doc.querySelector(`meta[property="${tag}"]`);
    const value = meta?.getAttribute('content');
    const key = tag.replace('og:', '') as keyof OpenGraphTags;

    if (value) {
      (og as Record<string, string | string[]>)[key] = value;
    } else {
      og.missing.push(tag);
    }
  });

  return og;
}

export function extractTwitterCard(doc: Document): TwitterCardTags {
  const twitter: TwitterCardTags = {
    missing: [],
  };

  const twitterTags = ['twitter:card', 'twitter:site', 'twitter:creator', 'twitter:title', 'twitter:description', 'twitter:image'];

  twitterTags.forEach((tag) => {
    const meta = doc.querySelector(`meta[name="${tag}"]`);
    const value = meta?.getAttribute('content');
    const key = tag.replace('twitter:', '') as keyof TwitterCardTags;

    if (value) {
      (twitter as Record<string, string | string[]>)[key] = value;
    } else {
      twitter.missing.push(tag);
    }
  });

  return twitter;
}

export function calculateWordCount(doc: Document): number {
  const body = doc.querySelector('body');
  if (!body) return 0;
  const text = body.textContent || '';
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

export function detectIssues(
  title: string,
  metaDescription: string,
  canonical: string,
  robots: string,
  headings: HeadingTag[],
  links: LinkInfo[],
  images: ImageInfo[],
  schemas: SchemaOrgData[],
  openGraph: OpenGraphTags,
  twitterCard: TwitterCardTags
): SEOIssue[] {
  const issues: SEOIssue[] = [];

  if (!title) {
    issues.push({type: 'error', category: 'Meta', message: 'Missing title tag'});
  } else if (title.length < 30) {
    issues.push({type: 'warning', category: 'Meta', message: 'Title tag is too short (less than 30 characters)', value: title});
  } else if (title.length > 60) {
    issues.push({type: 'warning', category: 'Meta', message: 'Title tag is too long (more than 60 characters)', value: title});
  }

  if (!metaDescription) {
    issues.push({type: 'error', category: 'Meta', message: 'Missing meta description'});
  } else if (metaDescription.length < 70) {
    issues.push({type: 'warning', category: 'Meta', message: 'Meta description is too short (less than 70 characters)', value: metaDescription});
  } else if (metaDescription.length > 160) {
    issues.push({type: 'warning', category: 'Meta', message: 'Meta description is too long (more than 160 characters)', value: metaDescription});
  }

  if (!canonical) {
    issues.push({type: 'warning', category: 'Meta', message: 'Missing canonical tag'});
  }

  if (!robots) {
    issues.push({type: 'info', category: 'Meta', message: 'No robots meta tag found (default: index, follow)'});
  } else if (robots.includes('noindex')) {
    issues.push({type: 'warning', category: 'Meta', message: 'Page is set to noindex', value: robots});
  }

  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count === 0) {
    issues.push({type: 'error', category: 'Headings', message: 'Missing H1 tag'});
  } else if (h1Count > 1) {
    issues.push({type: 'warning', category: 'Headings', message: `Multiple H1 tags found (${h1Count})`, value: String(h1Count)});
  }

  const brokenLinks = links.filter((l) => l.isBroken);
  if (brokenLinks.length > 0) {
    issues.push({type: 'error', category: 'Links', message: `Found ${brokenLinks.length} broken link(s)`, value: String(brokenLinks.length)});
  }

  const imagesWithoutAlt = images.filter((img) => !img.hasAlt);
  if (imagesWithoutAlt.length > 0) {
    issues.push({type: 'error', category: 'Images', message: `Found ${imagesWithoutAlt.length} image(s) without alt text`, value: String(imagesWithoutAlt.length)});
  }

  if (schemas.length === 0) {
    issues.push({type: 'info', category: 'Schema', message: 'No structured data (JSON-LD) found'});
  } else {
    const invalidSchemas = schemas.filter((s) => !s.isValid);
    if (invalidSchemas.length > 0) {
      issues.push({type: 'error', category: 'Schema', message: `Found ${invalidSchemas.length} invalid JSON-LD schema(s)`, value: String(invalidSchemas.length)});
    }
  }

  if (openGraph.missing.length > 0) {
    issues.push({type: 'warning', category: 'Social', message: `Missing Open Graph tags: ${openGraph.missing.join(', ')}`, value: String(openGraph.missing.length)});
  }

  if (twitterCard.missing.length > 0) {
    issues.push({type: 'warning', category: 'Social', message: `Missing Twitter Card tags: ${twitterCard.missing.join(', ')}`, value: String(twitterCard.missing.length)});
  }

  return issues;
}
