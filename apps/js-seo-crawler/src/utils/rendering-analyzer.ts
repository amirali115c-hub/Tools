import {FrameworkDetection, RenderingStrategy, RenderingAnalysis} from '../types/phase1';

export function detectFramework(html: string, headers?: Record<string, string>): FrameworkDetection {
  const frameworks: FrameworkDetection[] = [];

  // Next.js detection
  if (html.includes('__NEXT_DATA__') || html.includes('_next/static')) {
    const isAppRouter = html.includes('app/React.FC') || html.includes('__next_app__') || html.includes('next/dist/compiled');
    const isPagesRouter = html.includes('__NEXT_DATA__') && !isAppRouter;

    frameworks.push({
      framework: 'Next.js',
      renderer: isAppRouter ? 'App Router (RSC + Streaming)' : 'Pages Router',
      router: isAppRouter ? 'app' : 'pages',
      confidence: 0.95,
      evidence: isAppRouter
        ? ['Found __next_app__ or app router markers', 'React Server Components detected']
        : ['Found __NEXT_DATA__ script tag', 'Pages Router structure detected'],
    });

    // Detect ISR
    if (html.includes('x-nextjs-cache') || html.includes('stale-while-revalidate')) {
      frameworks[frameworks.length - 1].router += ' + ISR';
    }
  }

  // Nuxt.js detection
  if (html.includes('__NUXT__') || html.includes('_nuxt/') || html.includes('nuxt')) {
    const isNuxt3 = html.includes('nuxt3') || html.includes('useNuxtApp');
    frameworks.push({
      framework: 'Nuxt.js',
      version: isNuxt3 ? '3.x' : '2.x',
      renderer: isNuxt3 ? 'Nuxt 3 (Nitro SSR)' : 'Nuxt 2',
      confidence: 0.9,
      evidence: isNuxt3
        ? ['Found Nuxt 3 markers', 'Nitro server engine detected']
        : ['Found __NUXT__ script tag', 'Vue SSR detected'],
    });
  }

  // Gatsby detection
  if (html.includes('gatsby') || html.includes('___gatsby')) {
    frameworks.push({
      framework: 'Gatsby',
      renderer: 'Static (SSG)',
      confidence: 0.85,
      evidence: ['Found Gatsby markers', 'Static HTML generation detected'],
    });
  }

  // Remix detection
  if (html.includes('__remixContext') || html.includes('remix-run')) {
    frameworks.push({
      framework: 'Remix',
      renderer: 'SSR + Edge',
      confidence: 0.9,
      evidence: ['Found Remix context', 'Server-side rendering detected'],
    });
  }

  // Astro detection
  if (html.includes('astro-islands') || html.includes('data-astro-cid')) {
    frameworks.push({
      framework: 'Astro',
      renderer: 'Islands Architecture',
      confidence: 0.9,
      evidence: ['Found Astro islands', 'Partial hydration detected'],
    });
  }

  // SvelteKit detection
  if (html.includes('__sveltekit') || html.includes('svelte')) {
    frameworks.push({
      framework: 'SvelteKit',
      renderer: 'SSR + CSR hybrid',
      confidence: 0.85,
      evidence: ['Found SvelteKit markers', 'Svelte hydration detected'],
    });
  }

  // Angular detection
  if (html.includes('ng-version') || html.includes('angular')) {
    frameworks.push({
      framework: 'Angular',
      renderer: 'CSR (Universal for SSR)',
      confidence: 0.8,
      evidence: ['Found Angular version tag', 'Client-side rendering detected'],
    });
  }

  // React detection (generic)
  if (html.includes('react') || html.includes('data-reactroot') || html.includes('_reactRoot')) {
    frameworks.push({
      framework: 'React',
      renderer: 'CSR',
      confidence: 0.6,
      evidence: ['Found React markers', 'Client-side rendering detected'],
    });
  }

  // Vue detection (generic)
  if (html.includes('vue') || html.includes('data-v-')) {
    frameworks.push({
      framework: 'Vue.js',
      renderer: 'CSR',
      confidence: 0.6,
      evidence: ['Found Vue.js markers', 'Client-side rendering detected'],
    });
  }

  // Sort by confidence
  frameworks.sort((a, b) => b.confidence - a.confidence);

  return frameworks[0] || {
    framework: 'Unknown',
    renderer: 'Unknown',
    confidence: 0,
    evidence: ['No framework markers detected'],
  };
}

export function detectRenderingStrategy(
  rawHtml: string,
  doc: Document,
  framework: FrameworkDetection
): {strategy: RenderingStrategy; confidence: number; evidence: string[]} {
  const evidence: string[] = [];
  let strategy: RenderingStrategy = 'Unknown';
  let confidence = 0;

  const bodyContent = doc.querySelector('body')?.textContent?.trim() || '';
  const hasContent = bodyContent.length > 100;
  const hasScripts = rawHtml.includes('<script');
  const hasNextData = rawHtml.includes('__NEXT_DATA__');
  const hasNuxtData = rawHtml.includes('__NUXT__');
  const hasGatsby = rawHtml.includes('gatsby');
  const hasRemix = rawHtml.includes('__remixContext');

  // SSG detection (Gatsby, Astro, etc.)
  if (hasGatsby || framework.framework === 'Astro') {
    strategy = 'SSG';
    confidence = 0.9;
    evidence.push('Static site generation detected');
    evidence.push('Pre-rendered HTML with hydration markers');
  }
  // ISR detection
  else if (framework.router?.includes('ISR') || rawHtml.includes('stale-while-revalidate')) {
    strategy = 'ISR';
    confidence = 0.85;
    evidence.push('Incremental Static Regeneration detected');
    evidence.push('Content is statically generated but revalidated periodically');
  }
  // SSR detection
  else if (framework.framework === 'Next.js' && framework.renderer.includes('App Router')) {
    strategy = 'SSR';
    confidence = 0.9;
    evidence.push('React Server Components detected');
    evidence.push('Server-side rendering with streaming');
  }
  else if (framework.framework === 'Remix' || framework.framework === 'SvelteKit') {
    strategy = 'SSR';
    confidence = 0.85;
    evidence.push('Server-side rendering detected');
    evidence.push('Server-first architecture');
  }
  else if (framework.framework === 'Nuxt.js' && framework.version === '3.x') {
    strategy = 'SSR';
    confidence = 0.85;
    evidence.push('Nitro SSR engine detected');
  }
  // CSR detection
  else if (hasContent && hasNextData) {
    strategy = 'SSR';
    confidence = 0.8;
    evidence.push('Content present in initial HTML (server-rendered)');
    evidence.push('__NEXT_DATA__ found');
  }
  else if (hasContent && hasNuxtData) {
    strategy = 'SSR';
    confidence = 0.8;
    evidence.push('Content present in initial HTML (server-rendered)');
    evidence.push('__NUXT__ data found');
  }
  else if (hasContent && !hasScripts) {
    strategy = 'SSG';
    confidence = 0.85;
    evidence.push('Content present without JavaScript dependencies');
    evidence.push('Pure HTML output');
  }
  else if (hasContent && hasScripts) {
    strategy = 'SSR';
    confidence = 0.7;
    evidence.push('Content present in initial HTML');
    evidence.push('JavaScript present for hydration');
  }
  else if (!hasContent && hasScripts) {
    strategy = 'CSR';
    confidence = 0.8;
    evidence.push('No meaningful content in initial HTML');
    evidence.push('Content rendered by JavaScript');
  }

  return {strategy, confidence, evidence};
}

export function analyzeRendering(
  rawHtml: string,
  renderedDoc: Document,
  baseUrl: string
): RenderingAnalysis {
  const framework = detectFramework(rawHtml);
  const {strategy, confidence, evidence} = detectRenderingStrategy(rawHtml, renderedDoc, framework);

  const rawDoc = new DOMParser().parseFromString(rawHtml, 'text/html');

  const rawBody = rawDoc.querySelector('body')?.textContent?.trim() || '';
  const renderedBody = renderedDoc.querySelector('body')?.textContent?.trim() || '';

  const rawHtmlLength = rawHtml.length;
  const renderedHtmlLength = renderedDoc.documentElement.outerHTML.length;
  const contentDelta = renderedHtmlLength - rawHtmlLength;
  const contentDeltaPercent = rawHtmlLength > 0 ? Math.round((contentDelta / rawHtmlLength) * 100) : 0;

  const rawLinks = rawDoc.querySelectorAll('a[href]');
  const renderedLinks = renderedDoc.querySelectorAll('a[href]');
  const linksOnlyAfterRender = Math.max(0, renderedLinks.length - rawLinks.length);

  const rawImages = rawDoc.querySelectorAll('img');
  const renderedImages = renderedDoc.querySelectorAll('img');
  const imagesOnlyAfterRender = Math.max(0, renderedImages.length - rawImages.length);

  const rawTitle = rawDoc.querySelector('title')?.textContent?.trim() || '';
  const renderedTitle = renderedDoc.querySelector('title')?.textContent?.trim() || '';
  const rawMetaDesc = rawDoc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const renderedMetaDesc = renderedDoc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

  const missingInRender: string[] = [];
  if (!rawTitle && renderedTitle) missingInRender.push('Title tag');
  if (!rawMetaDesc && renderedMetaDesc) missingInRender.push('Meta description');

  const addedByJs: string[] = [];
  if (rawTitle && !renderedTitle) addedByJs.push('Title tag');
  if (rawMetaDesc && !renderedMetaDesc) addedByJs.push('Meta description');

  const criticalContentMissing = missingInRender.length > 0 || linksOnlyAfterRender > 10;

  let seoImpact: RenderingAnalysis['seoImpact'] = 'none';
  let seoImpactExplanation = '';

  if (strategy === 'CSR' && !criticalContentMissing) {
    seoImpact = 'critical';
    seoImpactExplanation = 'Page uses Client-Side Rendering. Content may not be visible to search engines without JavaScript execution.';
  } else if (criticalContentMissing) {
    seoImpact = 'high';
    seoImpactExplanation = `Critical SEO elements (${missingInRender.join(', ')}) are missing from raw HTML but present after JavaScript execution.`;
  } else if (linksOnlyAfterRender > 5) {
    seoImpact = 'medium';
    seoImpactExplanation = `${linksOnlyAfterRender} links only exist after JavaScript execution. Crawl depth may be affected.`;
  } else if (imagesOnlyAfterRender > 3) {
    seoImpact = 'medium';
    seoImpactExplanation = `${imagesOnlyAfterRender} images only load after JavaScript execution.`;
  } else if (strategy === 'SSR' || strategy === 'SSG') {
    seoImpact = 'none';
    seoImpactExplanation = 'Page is server-rendered or statically generated. Content is available in initial HTML.';
  }

  const recommendations: string[] = [];
  if (strategy === 'CSR') {
    recommendations.push('Consider server-side rendering (SSR) or static site generation (SSG) for critical pages');
    recommendations.push('Ensure important content is in the initial HTML response');
    recommendations.push('Implement dynamic rendering as a fallback for crawlers');
  }
  if (criticalContentMissing) {
    recommendations.push('Move title and meta description to server-rendered HTML');
    recommendations.push('Do not inject SEO-critical tags via JavaScript');
  }
  if (linksOnlyAfterRender > 5) {
    recommendations.push('Ensure internal links are in the initial HTML for crawlability');
    recommendations.push('Consider pre-rendering navigation links');
  }
  if (framework.framework === 'Next.js') {
    recommendations.push('Use App Router with React Server Components for better SEO');
    recommendations.push('Avoid "use client" on pages that need to be indexed');
  }

  return {
    strategy,
    confidence,
    evidence,
    framework,
    rawHtmlLength,
    renderedHtmlLength,
    contentDelta,
    contentDeltaPercent,
    missingInRender,
    addedByJs,
    linksOnlyAfterRender,
    imagesOnlyAfterRender,
    criticalContentMissing,
    seoImpact,
    seoImpactExplanation,
    recommendations,
  };
}
