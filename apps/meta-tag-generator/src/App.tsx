import {useState, useCallback} from 'react';
import {Copy, Check, Tag, RotateCcw, Globe, Smartphone, Monitor} from 'lucide-react';

interface MetaTags {
  title: string;
  description: string;
  keywords: string;
  author: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonical: string;
  viewport: string;
  charset: string;
  themeColor: string;
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

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const html = generateHtml();
  const previewTitle = meta.ogTitle || meta.title || 'Page Title';
  const previewDesc = meta.ogDescription || meta.description || 'Page description will appear here...';
  const previewUrl = meta.ogUrl || meta.canonical || 'https://example.com';

  const InputField = ({label, value, onChange, placeholder, maxLength, type = 'text'}: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string; maxLength?: number; type?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          maxLength={maxLength}
        />
      ) : (
        <input
          type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength}
        />
      )}
      {maxLength && <p className="text-xs text-gray-500 mt-1">{value.length}/{maxLength} characters</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Tag className="w-4 h-4" /> Free Meta Tag Generator
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Free Meta Tag Generator</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate SEO-optimized meta tags for your website. Includes Open Graph, Twitter Cards, and all essential HTML meta tags.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex gap-1">
              {(['basic', 'openGraph', 'twitter', 'advanced'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {tab === 'basic' ? 'Basic SEO' : tab === 'openGraph' ? 'Open Graph' : tab === 'twitter' ? 'Twitter' : 'Advanced'}
                </button>
              ))}
            </div>

            {activeTab === 'basic' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Basic SEO Meta Tags</h2>
                <InputField label="Title Tag" value={meta.title} onChange={(v) => update('title', v)} placeholder="My Page Title - Brand Name" maxLength={60} />
                <InputField label="Meta Description" value={meta.description} onChange={(v) => update('description', v)} placeholder="A compelling description that encourages clicks..." maxLength={160} type="textarea" />
                <InputField label="Keywords (comma separated)" value={meta.keywords} onChange={(v) => update('keywords', v)} placeholder="seo, meta tags, website optimization" />
                <InputField label="Author" value={meta.author} onChange={(v) => update('author', v)} placeholder="Your Name" />
              </div>
            )}

            {activeTab === 'openGraph' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Open Graph (Facebook/LinkedIn)</h2>
                <InputField label="OG Title" value={meta.ogTitle} onChange={(v) => update('ogTitle', v)} placeholder="Title for social sharing" maxLength={60} />
                <InputField label="OG Description" value={meta.ogDescription} onChange={(v) => update('ogDescription', v)} placeholder="Description for social sharing" maxLength={200} type="textarea" />
                <InputField label="OG Image URL" value={meta.ogImage} onChange={(v) => update('ogImage', v)} placeholder="https://example.com/image.jpg" />
                <InputField label="OG URL" value={meta.ogUrl} onChange={(v) => update('ogUrl', v)} placeholder="https://example.com/page" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OG Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={meta.ogType} onChange={(e) => update('ogType', e.target.value)}>
                    <option value="website">Website</option>
                    <option value="article">Article</option>
                    <option value="product">Product</option>
                    <option value="profile">Profile</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'twitter' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Twitter Card</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={meta.twitterCard} onChange={(e) => update('twitterCard', e.target.value)}>
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary Large Image</option>
                    <option value="app">App</option>
                    <option value="player">Player</option>
                  </select>
                </div>
                <InputField label="Twitter Title" value={meta.twitterTitle} onChange={(v) => update('twitterTitle', v)} placeholder="Title for Twitter" maxLength={60} />
                <InputField label="Twitter Description" value={meta.twitterDescription} onChange={(v) => update('twitterDescription', v)} placeholder="Description for Twitter" maxLength={200} type="textarea" />
                <InputField label="Twitter Image URL" value={meta.twitterImage} onChange={(v) => update('twitterImage', v)} placeholder="https://example.com/image.jpg" />
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Advanced Settings</h2>
                <InputField label="Canonical URL" value={meta.canonical} onChange={(v) => update('canonical', v)} placeholder="https://example.com/page" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Robots</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={meta.robots} onChange={(e) => update('robots', e.target.value)}>
                    <option value="index, follow">Index, Follow</option>
                    <option value="noindex, follow">Noindex, Follow</option>
                    <option value="index, nofollow">Index, Nofollow</option>
                    <option value="noindex, nofollow">Noindex, Nofollow</option>
                  </select>
                </div>
                <InputField label="Theme Color" value={meta.themeColor} onChange={(v) => update('themeColor', v)} placeholder="#4f46e5" />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => handleCopy(html)}
                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy HTML'}
              </button>
              <button onClick={() => {setMeta(DEFAULT_META); setCopied(false);}}
                className="px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors" title="Reset">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Preview & Code */}
          <div className="space-y-6">
            {/* Google Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" /> Google Search Preview
              </h2>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">https://example.com</p>
                <p className="text-lg text-blue-700 font-medium hover:underline cursor-pointer mb-1">{previewTitle}</p>
                <p className="text-sm text-gray-600">{previewDesc.slice(0, 155)}{previewDesc.length > 155 ? '...' : ''}</p>
              </div>
            </div>

            {/* Social Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Preview</h2>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                {meta.ogImage && (
                  <div className="bg-gray-200 rounded-lg h-40 flex items-center justify-center text-gray-500 text-sm">
                    OG Image Preview
                  </div>
                )}
                <p className="text-xs text-gray-400 truncate">{previewUrl}</p>
                <p className="font-semibold text-gray-900 text-sm">{previewTitle}</p>
                <p className="text-sm text-gray-600">{previewDesc.slice(0, 100)}{previewDesc.length > 100 ? '...' : ''}</p>
              </div>
            </div>

            {/* Generated Code */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Generated HTML</h2>
              </div>
              {html ? (
                <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-[400px]">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{html}</pre>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Fill in the form to see your meta tags</p>
                </div>
              )}
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
              <h3 className="font-semibold text-indigo-900 mb-2">Meta Tag Best Practices</h3>
              <ul className="text-sm text-indigo-800 space-y-1.5">
                <li>• Keep title tags under 60 characters</li>
                <li>• Keep meta descriptions under 160 characters</li>
                <li>• Always include a canonical URL</li>
                <li>• Use Open Graph tags for better social sharing</li>
                <li>• Include target keywords naturally in title and description</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
