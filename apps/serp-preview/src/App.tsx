import {useState, useCallback} from 'react';
import {Eye, Monitor, Smartphone, RotateCcw, Info, Check} from 'lucide-react';

function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [date, setDate] = useState('');
  const [siteName, setSiteName] = useState('');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  const truncateTitle = (t: string, max: number) => {
    if (t.length <= max) return t;
    return t.slice(0, max - 3) + '...';
  };

  const truncateDescription = (d: string, max: number) => {
    if (d.length <= max) return d;
    return d.slice(0, max - 3) + '...';
  };

  const displayTitle = title || 'Page Title - Your Brand Name';
  const displayDesc = description || 'A compelling meta description that encourages users to click through from search results to your website...';
  const displayUrl = url || 'https://example.com/page';
  const displaySiteName = siteName || 'example.com';

  const displayTitleTruncated = truncateTitle(displayTitle, device === 'desktop' ? 60 : 50);
  const displayDescTruncated = truncateDescription(displayDesc, device === 'desktop' ? 155 : 120);

  const extractBreadcrumb = (urlStr: string) => {
    try {
      const u = new URL(urlStr.startsWith('http') ? urlStr : 'https://' + urlStr);
      const parts = u.pathname.split('/').filter(Boolean);
      return [u.hostname.replace('www.', ''), ...parts].join(' › ');
    } catch {
      return displayUrl;
    }
  };

  const today = new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Eye className="w-4 h-4" /> Free SERP Preview Tool
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Free SERP Preview Tool</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See exactly how your page will look in Google search results. Preview title tags, meta descriptions, and rich snippets before publishing.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Page Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title Tag</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  placeholder="My Page Title - Brand Name" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={70} />
                <p className={`text-xs mt-1 ${title.length > 60 ? 'text-red-500' : 'text-gray-500'}`}>
                  {title.length}/60 characters {title.length > 60 ? '(may be truncated)' : ''}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  placeholder="A compelling description that encourages clicks from search results..." value={description}
                  onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={200} />
                <p className={`text-xs mt-1 ${description.length > 155 ? 'text-red-500' : 'text-gray-500'}`}>
                  {description.length}/155 characters {description.length > 155 ? '(may be truncated)' : ''}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page URL</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  placeholder="https://example.com/page" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    placeholder="example.com" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    placeholder="Jan 15, 2025" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Device Toggle */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center justify-center gap-4">
              <button onClick={() => setDevice('desktop')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${device === 'desktop' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <Monitor className="w-4 h-4" /> Desktop
              </button>
              <button onClick={() => setDevice('mobile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${device === 'mobile' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <Smartphone className="w-4 h-4" /> Mobile
              </button>
            </div>

            <button onClick={() => {setTitle(''); setDescription(''); setUrl(''); setSiteName(''); setDate('');}}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Reset All Fields
            </button>
          </div>

          {/* Right: Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Search Preview</h2>
              <div className={`mx-auto ${device === 'mobile' ? 'max-w-[360px]' : 'max-w-full'}`}>
                {/* Desktop Preview */}
                {device === 'desktop' && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                        {displaySiteName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-gray-700">{displaySiteName}</span>
                        <span className="mx-1">·</span>
                        <span>{date || today}</span>
                      </div>
                    </div>
                    <h3 className="text-xl text-blue-700 hover:underline cursor-pointer mb-1 font-normal leading-tight">
                      {displayTitleTruncated}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {displayDescTruncated}
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      {extractBreadcrumb(displayUrl)}
                    </div>
                  </div>
                )}

                {/* Mobile Preview */}
                {device === 'mobile' && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                        {displaySiteName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-700">{displaySiteName}</span>
                      <span className="text-gray-400">· {date || today}</span>
                    </div>
                    <h3 className="text-base text-blue-700 hover:underline cursor-pointer mb-1 font-normal leading-tight">
                      {displayTitleTruncated}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {displayDescTruncated}
                    </p>
                    <div className="mt-1.5 text-xs text-gray-400 truncate">
                      {extractBreadcrumb(displayUrl)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Character Counter Tips */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-green-500" /> SERP Character Limits
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Title Tag</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">50-60 characters</span>
                    <div className={`w-3 h-3 rounded-full ${title.length <= 60 ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Meta Description</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">120-155 characters</span>
                    <div className={`w-3 h-3 rounded-full ${description.length <= 155 ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
              <h3 className="font-semibold text-green-900 mb-2">SERP Optimization Tips</h3>
              <ul className="text-sm text-green-800 space-y-1.5">
                <li>• Put your primary keyword near the beginning of the title</li>
                <li>• Make descriptions compelling with a clear call-to-action</li>
                <li>• Use numbers and power words to increase click-through rate</li>
                <li>• Include your brand name at the end of the title</li>
                <li>• Match search intent with your title and description</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
