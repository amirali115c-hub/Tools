import {useState} from 'react';
import {InputMode, CrawlResult} from '../types';
import {parseHTML, extractTitle, extractMetaDescription, extractCanonical, extractRobots, extractMetaTags, extractHeadings, extractLinks, extractImages, extractSchemaOrg, extractOpenGraph, extractTwitterCard, calculateWordCount, detectIssues} from '../utils/seo-analyzer';
import {fetchWithCORS, normalizeUrl} from '../utils/url-fetcher';
import {analyzeRendering} from '../utils/rendering-analyzer';
import {analyzeAICrawlerAccess, getAISummary} from '../utils/ai-crawler-analyzer';
import {validateLlmsTxt} from '../utils/llms-txt-validator';
import {Phase1Data} from '../types/phase1';

interface InputPanelProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  onResult: (result: CrawlResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Example Page - Free Online Tools</title>
  <meta name="description" content="This is an example page for testing the SEO crawler tool.">
  <link rel="canonical" href="https://example.com/page">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Example Page">
  <meta property="og:description" content="This is an example page for testing.">
  <meta property="og:image" content="https://example.com/image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Example Page",
    "description": "This is an example page for testing the SEO crawler tool."
  }
  </script>
</head>
<body>
  <h1>Example Page Title</h1>
  <h2>Introduction</h2>
  <p>This is a sample page with some content for testing the SEO crawler.</p>
  <h2>Features</h2>
  <ul>
    <li>Feature one</li>
    <li>Feature two</li>
  </ul>
  <img src="hero.jpg" alt="Hero image">
  <img src="banner.png">
  <a href="https://example.com/about">About Us</a>
  <a href="https://external.com">External Link</a>
  <a href="/contact">Contact</a>
</body>
</html>`;

export function InputPanel({inputMode, setInputMode, onResult, isLoading, setIsLoading, error, setError}: InputPanelProps) {
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState(SAMPLE_HTML);

  const analyzeHTML = (htmlContent: string, targetUrl: string) => {
    const startTime = Date.now();
    const doc = parseHTML(htmlContent);

    const title = extractTitle(doc);
    const metaDescription = extractMetaDescription(doc);
    const canonical = extractCanonical(doc);
    const robots = extractRobots(doc);
    const metaTags = extractMetaTags(doc);
    const headings = extractHeadings(doc);
    const links = extractLinks(doc, targetUrl);
    const images = extractImages(doc, targetUrl);
    const schemas = extractSchemaOrg(doc);
    const openGraph = extractOpenGraph(doc);
    const twitterCard = extractTwitterCard(doc);
    const wordCount = calculateWordCount(doc);

    const issues = detectIssues(
      title,
      metaDescription,
      canonical,
      robots,
      headings,
      links,
      images,
      schemas,
      openGraph,
      twitterCard
    );

    const result: CrawlResult = {
      url: targetUrl,
      title,
      metaDescription,
      canonical,
      robots,
      metaTags,
      headings,
      links,
      images,
      schemas,
      openGraph,
      twitterCard,
      issues,
      wordCount,
      htmlSize: new Blob([htmlContent]).size,
      loadTime: Date.now() - startTime,
    };

    return result;
  };

  const analyzePhase1 = async (htmlContent: string, targetUrl: string): Promise<Phase1Data> => {
    const doc = parseHTML(htmlContent);

    // Rendering analysis
    const rendering = analyzeRendering(htmlContent, doc, targetUrl);

    // AI crawler analysis
    const robotsTxtLines = htmlContent.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    const robotsContent = robotsTxtLines ? robotsTxtLines[1] : '';
    const aiCrawlers = analyzeAICrawlerAccess(robotsContent, htmlContent);

    // llms.txt validation
    let llmsTxt;
    try {
      llmsTxt = await validateLlmsTxt(targetUrl);
    } catch {
      llmsTxt = {
        exists: false,
        url: `${new URL(targetUrl).protocol}//${new URL(targetUrl).hostname}/llms.txt`,
        isValid: false,
        hasOrganization: false,
        hasDescription: false,
        hasPages: false,
        issues: ['Failed to check llms.txt'],
        suggestions: ['Ensure your server returns the file with correct MIME type'],
      };
    }

    return {
      rendering,
      aiCrawlers,
      llmsTxt,
    };
  };

  const handleAnalyzeURL = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedUrl = normalizeUrl(url);
      const {html: htmlContent, statusCode, loadTime} = await fetchWithCORS(normalizedUrl);
      const result = analyzeHTML(htmlContent, normalizedUrl);
      result.statusCode = statusCode;
      result.loadTime = loadTime;

      // Run Phase 1 analysis
      try {
        result.phase1 = await analyzePhase1(htmlContent, normalizedUrl);
      } catch {
        // Phase 1 analysis is optional, don't fail if it errors
      }

      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeHTML = () => {
    if (!html.trim()) {
      setError('Please enter HTML content');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = analyzeHTML(html, 'https://pasted-html.local');

      // Run Phase 1 analysis for pasted HTML
      try {
        result.phase1 = {
          rendering: analyzeRendering(html, parseHTML(html), 'https://pasted-html.local'),
          aiCrawlers: analyzeAICrawlerAccess('', html),
          llmsTxt: {
            exists: false,
            url: '',
            isValid: false,
            hasOrganization: false,
            hasDescription: false,
            hasPages: false,
            issues: ['Cannot check llms.txt for pasted HTML'],
            suggestions: ['Enter a URL to check llms.txt'],
          },
        };
      } catch {
        // Phase 1 analysis is optional
      }

      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse HTML');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Mode Toggle */}
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setInputMode('url')}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
              inputMode === 'url'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            URL
          </button>
          <button
            onClick={() => setInputMode('html')}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
              inputMode === 'html'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HTML
          </button>
        </div>

        {inputMode === 'url' ? (
          <>
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeURL()}
              />
            </div>
            <button
              onClick={handleAnalyzeURL}
              disabled={isLoading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Analyze
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="flex-1">
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="<!DOCTYPE html>..."
                rows={4}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
              />
            </div>
            <button
              onClick={handleAnalyzeHTML}
              disabled={isLoading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              Analyze HTML
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      {!error && !isLoading && (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-indigo-500"></span>Meta & Headings</span>
          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-indigo-500"></span>Links & Images</span>
          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-purple-500"></span>JS Rendering</span>
          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-purple-500"></span>AI Crawlers</span>
          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-purple-500"></span>llms.txt</span>
        </div>
      )}
    </div>
  );
}
