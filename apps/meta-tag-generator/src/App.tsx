import {useState, useCallback} from 'react';
import {Copy, Check, Tag, RotateCcw, Globe, Eye} from 'lucide-react';

interface MetaTags {
  title: string; description: string; keywords: string; author: string; robots: string;
  ogTitle: string; ogDescription: string; ogImage: string; ogUrl: string; ogType: string;
  twitterCard: string; twitterTitle: string; twitterDescription: string; twitterImage: string;
  canonical: string; viewport: string; charset: string; themeColor: string;
}

const DEFAULT_META: MetaTags = {
  title: '', description: '', keywords: '', author: '', robots: 'index, follow',
  ogTitle: '', ogDescription: '', ogImage: '', ogUrl: '', ogType: 'website',
  twitterCard: 'summary_large_image', twitterTitle: '', twitterDescription: '',
  twitterImage: '', canonical: '', viewport: 'width=device-width, initial-scale=1.0',
  charset: 'UTF-8', themeColor: '#4f46e5',
};

function App() {
  const [meta, setMeta] = useState<MetaTags>(DEFAULT_META);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'openGraph' | 'twitter' | 'advanced'>('basic');

  const update = useCallback((key: keyof MetaTags, value: string) => {
    setMeta((prev) => ({...prev, [key]: value}));
  }, []);

  const generateHtml = useCallback(() => {
    const lines: string[] = [];
    if (meta.charset) lines.push(`<meta charset="${meta.charset}" />`);
    if (meta.viewport) lines.push(`<meta name="viewport" content="${meta.viewport}" />`);
    if (meta.title) lines.push(`<title>${meta.title}</title>`);
    if (meta.description) lines.push(`<meta name="description" content="${meta.description}" />`);
    if (meta.keywords) lines.push(`<meta name="keywords" content="${meta.keywords}" />`);
    if (meta.author) lines.push(`<meta name="author" content="${meta.author}" />`);
    if (meta.robots && meta.robots !== 'index, follow') lines.push(`<meta name="robots" content="${meta.robots}" />`);
    if (meta.canonical) lines.push(`<link rel="canonical" href="${meta.canonical}" />`);
    if (meta.themeColor) lines.push(`<meta name="theme-color" content="${meta.themeColor}" />`);
    if (meta.ogTitle || meta.ogDescription || meta.ogImage) {
      lines.push('', '<!-- Open Graph -->');
      if (meta.ogType) lines.push(`<meta property="og:type" content="${meta.ogType}" />`);
      if (meta.ogUrl) lines.push(`<meta property="og:url" content="${meta.ogUrl}" />`);
      if (meta.ogTitle) lines.push(`<meta property="og:title" content="${meta.ogTitle}" />`);
      if (meta.ogDescription) lines.push(`<meta property="og:description" content="${meta.ogDescription}" />`);
      if (meta.ogImage) lines.push(`<meta property="og:image" content="${meta.ogImage}" />`);
    }
    if (meta.twitterTitle || meta.twitterDescription || meta.twitterImage) {
      lines.push('', '<!-- Twitter Card -->');
      if (meta.twitterCard) lines.push(`<meta name="twitter:card" content="${meta.twitterCard}" />`);
      if (meta.twitterTitle) lines.push(`<meta name="twitter:title" content="${meta.twitterTitle}" />`);
      if (meta.twitterDescription) lines.push(`<meta name="twitter:description" content="${meta.twitterDescription}" />`);
      if (meta.twitterImage) lines.push(`<meta name="twitter:image" content="${meta.twitterImage}" />`);
    }
    return lines.join('\n');
  }, [meta]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generateHtml());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generateHtml]);

  const html = generateHtml();
  const previewTitle = meta.ogTitle || meta.title || 'Page Title';
  const previewDesc = meta.ogDescription || meta.description || 'Page description will appear here...';
  const previewUrl = meta.ogUrl || meta.canonical || 'https://example.com';

  const tabs = [
    {id: 'basic' as const, label: 'Basic SEO'},
    {id: 'openGraph' as const, label: 'Open Graph'},
    {id: 'twitter' as const, label: 'Twitter'},
    {id: 'advanced' as const, label: 'Advanced'},
  ];

  const InputField = ({label, value, onChange, placeholder, maxLength, type = 'text'}: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string; maxLength?: number; type?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600 transition-colors" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} rows={3} maxLength={maxLength} />
      ) : (
        <input type="text" className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600 transition-colors" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} />
      )}
      {maxLength && <p className={`text-xs mt-1 ${value.length > maxLength * 0.9 ? 'text-amber-400' : 'text-slate-500'}`}>{value.length}/{maxLength}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Meta Tag Generator</h1>
                <p className="text-xs text-slate-400">SEO-optimized meta tags with preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">Free</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-5">
            {/* Tabs */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-1.5 flex gap-1">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Basic SEO */}
            {activeTab === 'basic' && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Basic SEO</h2>
                <InputField label="Title Tag" value={meta.title} onChange={(v) => update('title', v)} placeholder="My Page Title - Brand Name" maxLength={60} />
                <InputField label="Meta Description" value={meta.description} onChange={(v) => update('description', v)} placeholder="A compelling description that encourages clicks..." maxLength={160} type="textarea" />
                <InputField label="Keywords (comma separated)" value={meta.keywords} onChange={(v) => update('keywords', v)} placeholder="seo, meta tags, website optimization" />
                <InputField label="Author" value={meta.author} onChange={(v) => update('author', v)} placeholder="Your Name" />
              </div>
            )}

            {/* Open Graph */}
            {activeTab === 'openGraph' && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Open Graph (Facebook/LinkedIn)</h2>
                <InputField label="OG Title" value={meta.ogTitle} onChange={(v) => update('ogTitle', v)} placeholder="Title for social sharing" maxLength={60} />
                <InputField label="OG Description" value={meta.ogDescription} onChange={(v) => update('ogDescription', v)} placeholder="Description for social sharing" maxLength={200} type="textarea" />
                <InputField label="OG Image URL" value={meta.ogImage} onChange={(v) => update('ogImage', v)} placeholder="https://example.com/image.jpg" />
                <InputField label="OG URL" value={meta.ogUrl} onChange={(v) => update('ogUrl', v)} placeholder="https://example.com/page" />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">OG Type</label>
                  <select className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500" value={meta.ogType} onChange={(e) => update('ogType', e.target.value)}>
                    <option value="website" className="bg-slate-900">Website</option>
                    <option value="article" className="bg-slate-900">Article</option>
                    <option value="product" className="bg-slate-900">Product</option>
                    <option value="profile" className="bg-slate-900">Profile</option>
                  </select>
                </div>
              </div>
            )}

            {/* Twitter */}
            {activeTab === 'twitter' && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Twitter Card</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Card Type</label>
                  <select className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500" value={meta.twitterCard} onChange={(e) => update('twitterCard', e.target.value)}>
                    <option value="summary" className="bg-slate-900">Summary</option>
                    <option value="summary_large_image" className="bg-slate-900">Summary Large Image</option>
                  </select>
                </div>
                <InputField label="Twitter Title" value={meta.twitterTitle} onChange={(v) => update('twitterTitle', v)} placeholder="Title for Twitter" maxLength={60} />
                <InputField label="Twitter Description" value={meta.twitterDescription} onChange={(v) => update('twitterDescription', v)} placeholder="Description for Twitter" maxLength={200} type="textarea" />
                <InputField label="Twitter Image URL" value={meta.twitterImage} onChange={(v) => update('twitterImage', v)} placeholder="https://example.com/image.jpg" />
              </div>
            )}

            {/* Advanced */}
            {activeTab === 'advanced' && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Advanced</h2>
                <InputField label="Canonical URL" value={meta.canonical} onChange={(v) => update('canonical', v)} placeholder="https://example.com/page" />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Robots</label>
                  <select className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500" value={meta.robots} onChange={(e) => update('robots', e.target.value)}>
                    <option value="index, follow" className="bg-slate-900">Index, Follow</option>
                    <option value="noindex, follow" className="bg-slate-900">Noindex, Follow</option>
                    <option value="index, nofollow" className="bg-slate-900">Index, Nofollow</option>
                    <option value="noindex, nofollow" className="bg-slate-900">Noindex, Nofollow</option>
                  </select>
                </div>
                <InputField label="Theme Color" value={meta.themeColor} onChange={(v) => update('themeColor', v)} placeholder="#4f46e5" />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleCopy} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy HTML'}
              </button>
              <button onClick={() => {setMeta(DEFAULT_META); setCopied(false);}} className="px-4 py-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-slate-200 transition-all" title="Reset">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Preview & Code */}
          <div className="space-y-5">
            {/* Google Preview */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4" /> Google Search Preview
              </h2>
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-green-700 mb-0.5 truncate">{previewUrl}</p>
                <p className="text-lg text-blue-700 font-normal hover:underline cursor-pointer mb-0.5 leading-tight">{previewTitle}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{previewDesc.slice(0, 155)}{previewDesc.length > 155 ? '...' : ''}</p>
              </div>
            </div>

            {/* Generated Code */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Generated HTML</h2>
              </div>
              {html ? (
                <div className="bg-slate-950 rounded-xl p-4 overflow-auto max-h-[400px] border border-slate-800">
                  <pre className="text-sm text-emerald-400 font-mono whitespace-pre-wrap">{html}</pre>
                </div>
              ) : (
                <div className="bg-slate-950/50 border-2 border-dashed border-slate-800 rounded-xl p-8 text-center">
                  <Tag className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Fill in the form to see your meta tags</p>
                </div>
              )}
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5">
              <h3 className="font-semibold text-indigo-400 text-sm mb-2">Best Practices</h3>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li>• Keep titles under 60 characters</li>
                <li>• Keep descriptions under 160 characters</li>
                <li>• Always include a canonical URL</li>
                <li>• Use Open Graph for better social sharing</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        Meta Tag Generator — Open Graph — Twitter Cards — Google Preview
      </footer>
    </div>
  );
}

export default App;
