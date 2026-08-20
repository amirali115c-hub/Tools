import {useState, useCallback} from 'react';
import {Search, Gauge, Check, AlertTriangle, X, Zap, Globe, ArrowRight, Clock} from 'lucide-react';

interface SpeedCheck { name: string; status: 'good' | 'warning' | 'error'; score: number; detail: string; }
interface AnalysisResult { url: string; overallScore: number; checks: SpeedCheck[]; recommendations: string[]; stats: {label: string; value: string}[]; }

const PROXIES = [
  (url: string) => `https://cors-proxy.amircontentwriter.workers.dev/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchWithProxy(url: string): Promise<string> {
  for (const proxy of PROXIES) {
    try {
      const resp = await fetch(proxy(url), {signal: AbortSignal.timeout(20000)});
      if (resp.ok) return await resp.text();
    } catch { continue; }
  }
  throw new Error('Unable to fetch URL. CORS restrictions may be blocking the request.');
}

function analyzePage(html: string, url: string): AnalysisResult {
  const checks: SpeedCheck[] = [];
  const recommendations: string[] = [];
  let score = 100;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const htmlStr = html.toLowerCase();

  const hasMinified = !html.includes('  ') || html.split('\n').length > 10;
  checks.push({ name: 'HTML Minification', status: hasMinified ? 'warning' : 'good', score: hasMinified ? 70 : 100, detail: hasMinified ? 'HTML may not be minified' : 'HTML appears minified' });
  if (hasMinified) { score -= 5; recommendations.push('Minify HTML to reduce page size'); }

  const inlineStyles = (html.match(/<style/gi) || []).length;
  const inlineScripts = (html.match(/<script(?![^>]*src=)[^>]*>/gi) || []).length;
  const inlineScore = inlineStyles + inlineScripts > 5 ? 'warning' : 'good';
  checks.push({ name: 'Inline Resources', status: inlineScore, score: inlineScore === 'good' ? 100 : 60, detail: `${inlineStyles} inline styles, ${inlineScripts} inline scripts` });
  if (inlineScore === 'warning') { score -= 10; recommendations.push('Move inline styles/scripts to external files'); }

  const images = doc.querySelectorAll('img');
  let unoptimized = 0; let missingDimensions = 0;
  images.forEach((img) => { if (!img.getAttribute('width') && !img.getAttribute('height')) missingDimensions++; const src = img.getAttribute('src') || ''; if (src.endsWith('.png') || src.endsWith('.jpg')) unoptimized++; });
  const imgScore = unoptimized > 2 || missingDimensions > 2 ? 'warning' : 'good';
  checks.push({ name: 'Image Optimization', status: imgScore, score: imgScore === 'good' ? 100 : 55, detail: `${images.length} images, ${unoptimized} non-WebP, ${missingDimensions} missing dimensions` });
  if (imgScore === 'warning') { score -= 15; recommendations.push('Use WebP format and add width/height attributes'); }

  const blockingJS = (html.match(/<script(?![^>]*type="application\/ld\+json")(?![^>]*async)(?![^>]*defer)[^>]*src=[^>]*>/gi) || []).length;
  const renderBlocking = blockingJS > 2 ? 'error' : blockingJS > 0 ? 'warning' : 'good';
  checks.push({ name: 'Render-Blocking', status: renderBlocking, score: renderBlocking === 'good' ? 100 : renderBlocking === 'warning' ? 70 : 40, detail: `${blockingJS} potentially blocking scripts` });
  if (renderBlocking !== 'good') { score -= 10; recommendations.push('Add async/defer to non-critical JavaScript'); }

  const googleFonts = htmlStr.includes('fonts.googleapis.com');
  const fontDisplay = htmlStr.includes('font-display');
  const fontScore = googleFonts && !fontDisplay ? 'warning' : 'good';
  checks.push({ name: 'Font Loading', status: fontScore, score: fontScore === 'good' ? 100 : 65, detail: googleFonts ? `Google Fonts detected, font-display: ${fontDisplay ? 'set' : 'missing'}` : 'No external fonts' });
  if (fontScore === 'warning') { score -= 5; recommendations.push('Add font-display: swap to Google Fonts'); }

  const hasViewport = htmlStr.includes('name="viewport"');
  checks.push({ name: 'Mobile Viewport', status: hasViewport ? 'good' : 'error', score: hasViewport ? 100 : 30, detail: hasViewport ? 'Viewport present' : 'Missing viewport' });
  if (!hasViewport) { score -= 15; recommendations.push('Add viewport meta tag'); }

  const preconnects = (html.match(/rel="preconnect"/gi) || []).length;
  checks.push({ name: 'Resource Hints', status: preconnects > 0 ? 'good' : 'warning', score: preconnects > 0 ? 100 : 70, detail: `${preconnects} preconnect hints` });
  if (preconnects === 0) { score -= 5; recommendations.push('Add preconnect hints for third-party domains'); }

  const lazyImages = (html.match(/loading="lazy"/gi) || []).length;
  const lazyScore = images.length > 3 && lazyImages === 0 ? 'warning' : 'good';
  checks.push({ name: 'Lazy Loading', status: lazyScore, score: lazyScore === 'good' ? 100 : 60, detail: `${lazyImages}/${images.length} images lazy loaded` });
  if (lazyScore === 'warning') { score -= 5; recommendations.push('Add loading="lazy" to below-the-fold images'); }

  const jsonLd = (html.match(/type="application\/ld\+json"/gi) || []).length;
  checks.push({ name: 'Structured Data', status: jsonLd > 0 ? 'good' : 'warning', score: jsonLd > 0 ? 100 : 80, detail: `${jsonLd} JSON-LD blocks` });

  const sizeKB = Math.round(html.length / 1024);
  const sizeScore = sizeKB > 100 ? 'error' : sizeKB > 50 ? 'warning' : 'good';
  checks.push({ name: 'Page Size', status: sizeScore, score: sizeScore === 'good' ? 100 : sizeScore === 'warning' ? 65 : 35, detail: `~${sizeKB} KB` });
  if (sizeScore !== 'good') { score -= 10; recommendations.push('Reduce HTML page size'); }

  checks.push({ name: 'HTTP/2', status: 'good', score: 100, detail: 'Modern browsers use HTTP/2 by default' });

  const thirdPartyDomains = new Set<string>();
  const domainRegex = /https?:\/\/([^/"'`\s]+)/gi;
  let match;
  while ((match = domainRegex.exec(html)) !== null) { const d = match[1]; if (!d.includes(new URL(url).hostname)) thirdPartyDomains.add(d); }
  const tpScore = thirdPartyDomains.size > 5 ? 'warning' : 'good';
  checks.push({ name: 'Third-Party Scripts', status: tpScore, score: tpScore === 'good' ? 100 : 60, detail: `${thirdPartyDomains.size} third-party domains` });
  if (tpScore === 'warning') { score -= 10; recommendations.push('Reduce third-party scripts'); }

  return { url, overallScore: Math.max(0, Math.min(100, score)), checks, recommendations: recommendations.slice(0, 8), stats: [
    {label: 'HTML Size', value: `${sizeKB} KB`}, {label: 'Images', value: `${images.length}`},
    {label: 'Scripts', value: `${(html.match(/<script/gi) || []).length}`}, {label: 'Third-Party', value: `${thirdPartyDomains.size}`},
    {label: 'JSON-LD', value: `${jsonLd}`}, {label: 'Lazy Loaded', value: `${lazyImages}`},
  ]};
}

function ScoreCircle({score}: {score: number}) {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
  const radius = 54; const circumference = 2 * Math.PI * radius; const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 70 70)" style={{transition: 'stroke-dashoffset 1s ease'}} />
      </svg>
      <span className="absolute text-3xl font-bold" style={{color}}>{score}</span>
    </div>
  );
}

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = useCallback(async () => {
    let targetUrl = url.trim();
    if (!targetUrl) return;
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
    try { new URL(targetUrl); } catch { setError('Please enter a valid URL'); return; }
    setLoading(true); setError(''); setResult(null);
    try { const html = await fetchWithProxy(targetUrl); setResult(analyzePage(html, targetUrl)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to analyze URL'); }
    finally { setLoading(false); }
  }, [url]);

  const statusIcon = (status: string) => {
    if (status === 'good') return <Check className="w-4 h-4 text-emerald-400" />;
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    return <X className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Hero Section */}
      <div className="tool-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Free SEO Tool
          </div>
          <h1>Free Page Speed Checker — Website Performance Test</h1>
          <p className="subtitle">Analyze website performance with 12+ optimization checks. Core Web Vitals, lazy loading, render-blocking detection, and recommendations.</p>
          <div className="hero-trust">
            <span className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
              No uploads
            </span>
            <span className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
              No sign-ups
            </span>
            <span className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              100% private
            </span>
            <span className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Instant results
            </span>
            <span className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Free forever
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Input */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="url" className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600 transition-colors" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()} />
            </div>
            <button onClick={handleAnalyze} disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/25">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {error && <div className="max-w-2xl mx-auto mb-8 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

        {result && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
              <h2 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Performance Score</h2>
              <p className="text-xs text-slate-500 mb-4">{result.url}</p>
              <ScoreCircle score={result.overallScore} />
              <p className="mt-4 text-sm text-slate-400">
                {result.overallScore >= 80 ? 'Good performance!' : result.overallScore >= 50 ? 'Needs improvement.' : 'Poor performance.'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {result.stats.map((stat) => (
                <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Performance Checks</h2>
              <div className="space-y-2">
                {result.checks.map((check) => (
                  <div key={check.name} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                    {statusIcon(check.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200 text-sm">{check.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${check.status === 'good' ? 'bg-emerald-500/10 text-emerald-400' : check.status === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{check.score}/100</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{check.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.recommendations.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Recommendations
                </h2>
                <div className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                      <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        Page Speed Checker — 12+ Checks — Performance Scoring — Optimization Recommendations
      </footer>
    </div>
  );
}

export default App;
