import {useState} from 'react';
import {Eye, Monitor, Smartphone, RotateCcw, Search} from 'lucide-react';

function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [date, setDate] = useState('');
  const [siteName, setSiteName] = useState('');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const truncate = (t: string, max: number) => t.length <= max ? t : t.slice(0, max - 3) + '...';

  const displayTitle = title || 'Page Title - Your Brand Name';
  const displayDesc = description || 'A compelling meta description that encourages users to click through from search results to your website...';
  const displayUrl = url || 'https://example.com/page';
  const displaySiteName = siteName || 'example.com';

  const extractBreadcrumb = (urlStr: string) => {
    try {
      const u = new URL(urlStr.startsWith('http') ? urlStr : 'https://' + urlStr);
      const parts = u.pathname.split('/').filter(Boolean);
      return [u.hostname.replace('www.', ''), ...parts].join(' › ');
    } catch { return displayUrl; }
  };

  const today = new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Hero Section */}
      <div className="tool-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Free SEO Tool
          </div>
          <h1>Free SERP Preview — Google Search Result Preview</h1>
          <p className="subtitle">See exactly how your page looks in Google search results. Desktop and mobile preview with character counter and breadcrumb preview.</p>
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
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-5">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Page Details</h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Title Tag</label>
                <input type="text" className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600 transition-colors" placeholder="My Page Title - Brand Name" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={70} />
                <p className={`text-xs mt-1 ${title.length > 60 ? 'text-amber-400' : 'text-slate-500'}`}>{title.length}/60 {title.length > 60 ? '(may truncate)' : ''}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Meta Description</label>
                <textarea className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600 transition-colors" placeholder="A compelling description that encourages clicks..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={200} />
                <p className={`text-xs mt-1 ${description.length > 155 ? 'text-amber-400' : 'text-slate-500'}`}>{description.length}/155 {description.length > 155 ? '(may truncate)' : ''}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Page URL</label>
                <input type="text" className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600 transition-colors" placeholder="https://example.com/page" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Site Name</label>
                  <input type="text" className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600 transition-colors" placeholder="example.com" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Publish Date</label>
                  <input type="text" className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600 transition-colors" placeholder="Jan 15, 2025" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
            </div>

            <button onClick={() => {setTitle(''); setDescription(''); setUrl(''); setSiteName(''); setDate('');}}
              className="w-full px-4 py-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-slate-200 transition-all flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>

            {/* Character Limits */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">SERP Limits</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-slate-400">Title Tag</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">50-60 chars</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${title.length <= 60 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-slate-400">Meta Description</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">120-155 chars</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${description.length <= 155 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-5">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4" /> Google Search Preview
              </h2>
              <div className={`mx-auto ${device === 'mobile' ? 'max-w-[360px]' : 'max-w-full'}`}>
                <div className="bg-white rounded-lg p-5 shadow-lg">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {displaySiteName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-gray-700">{displaySiteName}</span>
                      <span className="mx-1">·</span>
                      <span>{date || today}</span>
                    </div>
                  </div>
                  <h3 className={`${device === 'mobile' ? 'text-base' : 'text-xl'} text-blue-700 hover:underline cursor-pointer mb-1 font-normal leading-tight`}>
                    {truncate(displayTitle, device === 'mobile' ? 50 : 60)}
                  </h3>
                  <p className={`${device === 'mobile' ? 'text-xs' : 'text-sm'} text-gray-600 leading-relaxed`}>
                    {truncate(displayDesc, device === 'mobile' ? 120 : 155)}
                  </p>
                  <div className="mt-2 text-xs text-gray-400 truncate">
                    {extractBreadcrumb(displayUrl)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5">
              <h3 className="font-semibold text-indigo-400 text-sm mb-2">SERP Optimization Tips</h3>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li>• Put primary keyword near the beginning of the title</li>
                <li>• Make descriptions compelling with a clear CTA</li>
                <li>• Use numbers and power words for higher CTR</li>
                <li>• Include brand name at the end of the title</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        SERP Preview Tool — Desktop & Mobile — Real-time Google Simulation
      </footer>
    </div>
  );
}

export default App;
