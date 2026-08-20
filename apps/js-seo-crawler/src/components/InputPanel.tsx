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
      <h2 className="text-sm font-semibold text-white mb-3">Analyze</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setInputMode('url')}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
            inputMode === 'url'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          URL
        </button>
        <button
          onClick={() => setInputMode('html')}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
            inputMode === 'html'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          HTML
        </button>
      </div>

      {inputMode === 'url' ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Enter URL to analyze</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeURL()}
            />
          </div>
          <button
            onClick={handleAnalyzeURL}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              'Analyze URL'
            )}
          </button>
          <p className="text-[11px] text-slate-500">
            Uses CORS proxy to fetch pages. Some sites may block requests.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Paste HTML source code</label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="<!DOCTYPE html>..."
              rows={12}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
            />
          </div>
          <button
            onClick={handleAnalyzeHTML}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            Analyze HTML
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-800">
        <h3 className="text-xs font-medium text-slate-400 mb-2">Analysis Includes</h3>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
            Meta tags & headings
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
            Links & images
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-purple-500"></span>
            JS rendering detection
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-purple-500"></span>
            Framework detection
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-purple-500"></span>
            AI crawler access
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-purple-500"></span>
            llms.txt validation
          </span>
        </div>
      </div>
    </div>
  );
}
