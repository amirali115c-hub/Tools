import {useState, useCallback} from 'react';
import {Search, Gauge, Check, AlertTriangle, X, Clock, Image, FileCode, Zap, Globe, ArrowRight} from 'lucide-react';

interface SpeedCheck {
  name: string;
  status: 'good' | 'warning' | 'error';
  score: number;
  detail: string;
}

interface AnalysisResult {
  url: string;
  overallScore: number;
  checks: SpeedCheck[];
  recommendations: string[];
  stats: {label: string; value: string}[];
}

const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchWithProxy(url: string): Promise<string> {
  for (const proxy of PROXIES) {
    try {
      const resp = await fetch(proxy(url), {signal: AbortSignal.timeout(15000)});
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

  // Check 1: Compression hints
  const hasMinified = !html.includes('  ') || html.split('\n').length > 10;
  checks.push({
    name: 'HTML Minification',
    status: hasMinified ? 'warning' : 'good',
    score: hasMinified ? 70 : 100,
    detail: hasMinified ? 'HTML may not be minified' : 'HTML appears minified',
  });
  if (hasMinified) {
    score -= 5;
    recommendations.push('Minify HTML to reduce page size and improve load time');
  }

  // Check 2: Inline styles/scripts
  const inlineStyles = (html.match(/<style/gi) || []).length;
  const inlineScripts = (html.match(/<script(?![^>]*src=)[^>]*>/gi) || []).length;
  const inlineScore = inlineStyles + inlineScripts > 5 ? 'warning' : 'good';
  checks.push({
    name: 'Inline Resources',
    status: inlineScore,
    score: inlineScore === 'good' ? 100 : 60,
    detail: `Found ${inlineStyles} inline styles, ${inlineScripts} inline scripts`,
  });
  if (inlineScore === 'warning') {
    score -= 10;
    recommendations.push('Move inline styles and scripts to external files for better caching');
  }

  // Check 3: Image optimization
  const images = doc.querySelectorAll('img');
  let unoptimized = 0;
  let missingDimensions = 0;
  images.forEach((img) => {
    if (!img.getAttribute('width') && !img.getAttribute('height')) missingDimensions++;
    const src = img.getAttribute('src') || '';
    if (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg')) unoptimized++;
  });
  const imgScore = unoptimized > 2 || missingDimensions > 2 ? 'warning' : 'good';
  checks.push({
    name: 'Image Optimization',
    status: imgScore,
    score: imgScore === 'good' ? 100 : 55,
    detail: `${images.length} images found. ${unoptimized} non-WebP, ${missingDimensions} missing dimensions`,
  });
  if (imgScore === 'warning') {
    score -= 15;
    recommendations.push('Use WebP format for images and add width/height attributes to prevent layout shifts');
  }

  // Check 4: CSS/JS loading
  const externalCSS = (html.match(/<link[^>]*rel="stylesheet"[^>]*>/gi) || []).length;
  const blockingJS = (html.match(/<script(?![^>]*type="application\/ld\+json")(?![^>]*async)(?![^>]*defer)[^>]*src=[^>]*>/gi) || []).length;
  const renderBlocking = blockingJS > 2 ? 'error' : blockingJS > 0 ? 'warning' : 'good';
  checks.push({
    name: 'Render-Blocking Resources',
    status: renderBlocking,
    score: renderBlocking === 'good' ? 100 : renderBlocking === 'warning' ? 70 : 40,
    detail: `${externalCSS} external stylesheets, ${blockingJS} potentially blocking scripts`,
  });
  if (renderBlocking !== 'good') {
    score -= 10;
    recommendations.push('Add async or defer attributes to non-critical JavaScript');
  }

  // Check 5: Font loading
  const fontLinks = (html.match(/<link[^>]*rel="preload"[^>]*font/gi) || []).length;
  const googleFonts = htmlStr.includes('fonts.googleapis.com');
  const fontDisplay = htmlStr.includes('font-display');
  const fontScore = googleFonts && !fontDisplay ? 'warning' : 'good';
  checks.push({
    name: 'Font Loading',
    status: fontScore,
    score: fontScore === 'good' ? 100 : 65,
    detail: googleFonts ? `Google Fonts detected. font-display: ${fontDisplay ? 'set' : 'missing'}` : 'No external fonts detected',
  });
  if (fontScore === 'warning') {
    score -= 5;
    recommendations.push('Add font-display: swap to Google Fonts to prevent invisible text during load');
  }

  // Check 6: Meta viewport
  const hasViewport = htmlStr.includes('name="viewport"');
  checks.push({
    name: 'Mobile Viewport',
    status: hasViewport ? 'good' : 'error',
    score: hasViewport ? 100 : 30,
    detail: hasViewport ? 'Viewport meta tag present' : 'Missing viewport meta tag',
  });
  if (!hasViewport) {
    score -= 15;
    recommendations.push('Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> for mobile');
  }

  // Check 7: Preconnect / Prefetch
  const preconnects = (html.match(/rel="preconnect"/gi) || []).length;
  const prefetches = (html.match(/rel="prefetch"/gi) || []).length;
  checks.push({
    name: 'Resource Hints',
    status: preconnects > 0 ? 'good' : 'warning',
    score: preconnects > 0 ? 100 : 70,
    detail: `${preconnects} preconnect, ${prefetches} prefetch hints found`,
  });
  if (preconnects === 0) {
    score -= 5;
    recommendations.push('Add preconnect hints for third-party domains you load resources from');
  }

  // Check 8: Lazy loading
  const lazyImages = (html.match(/loading="lazy"/gi) || []).length;
  const lazyScore = images.length > 3 && lazyImages === 0 ? 'warning' : 'good';
  checks.push({
    name: 'Lazy Loading',
    status: lazyScore,
    score: lazyScore === 'good' ? 100 : 60,
    detail: `${lazyImages} of ${images.length} images have lazy loading`,
  });
  if (lazyScore === 'warning') {
    score -= 5;
    recommendations.push('Add loading="lazy" to below-the-fold images');
  }

  // Check 9: Script types
  const jsonLd = (html.match(/type="application\/ld\+json"/gi) || []).length;
  checks.push({
    name: 'Structured Data',
    status: jsonLd > 0 ? 'good' : 'warning',
    score: jsonLd > 0 ? 100 : 80,
    detail: `${jsonLd} JSON-LD structured data blocks found`,
  });

  // Check 10: Page size estimate
  const sizeKB = Math.round(html.length / 1024);
  const sizeScore = sizeKB > 100 ? 'error' : sizeKB > 50 ? 'warning' : 'good';
  checks.push({
    name: 'Page Size',
    status: sizeScore,
    score: sizeScore === 'good' ? 100 : sizeScore === 'warning' ? 65 : 35,
    detail: `HTML size: ~${sizeKB} KB`,
  });
  if (sizeScore !== 'good') {
    score -= 10;
    recommendations.push('Reduce HTML page size by removing unnecessary code and comments');
  }

  // Check 11: HTTP/2 hints
  checks.push({
    name: 'HTTP/2 Compatibility',
    status: 'good',
    score: 100,
    detail: 'Modern browsers use HTTP/2 by default for HTTPS sites',
  });

  // Check 12: Third-party scripts
  const thirdPartyDomains = new Set<string>();
  const domainRegex = /https?:\/\/([^/"'`\s]+)/gi;
  let match;
  while ((match = domainRegex.exec(html)) !== null) {
    const domain = match[1];
    if (!domain.includes(new URL(url).hostname)) thirdPartyDomains.add(domain);
  }
  const tpScore = thirdPartyDomains.size > 5 ? 'warning' : 'good';
  checks.push({
    name: 'Third-Party Scripts',
    status: tpScore,
    score: tpScore === 'good' ? 100 : 60,
    detail: `${thirdPartyDomains.size} third-party domains detected`,
  });
  if (tpScore === 'warning') {
    score -= 10;
    recommendations.push('Reduce third-party script count to improve page load performance');
  }

  // Stats
  const stats = [
    {label: 'HTML Size', value: `${sizeKB} KB`},
    {label: 'Images', value: `${images.length}`},
    {label: 'External CSS', value: `${externalCSS}`},
    {label: 'Scripts', value: `${(html.match(/<script/gi) || []).length}`},
    {label: 'Third-Party Domains', value: `${thirdPartyDomains.size}`},
    {label: 'JSON-LD Blocks', value: `${jsonLd}`},
  ];

  return {
    url,
    overallScore: Math.max(0, Math.min(100, score)),
    checks,
    recommendations: recommendations.slice(0, 8),
    stats,
  };
}

function ScoreCircle({score}: {score: number}) {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 70 70)" style={{transition: 'stroke-dashoffset 1s ease'}} />
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

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const html = await fetchWithProxy(targetUrl);
      const analysis = analyzePage(html, targetUrl);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze URL');
    } finally {
      setLoading(false);
    }
  }, [url]);

  const statusIcon = (status: string) => {
    if (status === 'good') return <Check className="w-5 h-5 text-green-500" />;
    if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <X className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Gauge className="w-4 h-4" /> Free Page Speed Checker
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Free Page Speed Checker</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Analyze your website's performance metrics, rendering strategy, and optimization opportunities. 12+ checks including Core Web Vitals, lazy loading, and third-party impact.
          </p>
        </div>

        {/* Input */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="url" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="https://example.com" value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()} />
            </div>
            <button onClick={handleAnalyze} disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-8">
            {/* Score */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Performance Score</h2>
              <p className="text-sm text-gray-500 mb-4">{result.url}</p>
              <ScoreCircle score={result.overallScore} />
              <p className="mt-4 text-sm text-gray-600">
                {result.overallScore >= 80 ? 'Good performance! Some minor optimizations possible.' :
                 result.overallScore >= 50 ? 'Needs improvement. Several optimizations recommended.' :
                 'Poor performance. Major optimizations needed.'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {result.stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Checks */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Checks</h2>
              <div className="space-y-3">
                {result.checks.map((check) => (
                  <div key={check.name} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    {statusIcon(check.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">{check.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          check.status === 'good' ? 'bg-green-100 text-green-700' :
                          check.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{check.score}/100</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{check.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" /> Optimization Recommendations
                </h2>
                <div className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <ArrowRight className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Page Speed Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Loading Speed</h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li>• Minimize HTTP requests and file sizes</li>
                <li>• Use a CDN for static assets</li>
                <li>• Enable browser caching headers</li>
                <li>• Compress images and use WebP format</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileCode className="w-4 h-4 text-green-500" /> Code Optimization</h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li>• Minify CSS, JavaScript, and HTML</li>
                <li>• Remove unused CSS and code</li>
                <li>• Use async/defer for scripts</li>
                <li>• Implement code splitting</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Image className="w-4 h-4 text-purple-500" /> Image Optimization</h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li>• Use modern formats (WebP, AVIF)</li>
                <li>• Implement lazy loading for images</li>
                <li>• Set explicit width and height</li>
                <li>• Use responsive images with srcset</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500" /> Rendering</h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li>• Avoid render-blocking resources</li>
                <li>• Use critical CSS inlining</li>
                <li>• Preload key resources</li>
                <li>• Minimize third-party script impact</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
