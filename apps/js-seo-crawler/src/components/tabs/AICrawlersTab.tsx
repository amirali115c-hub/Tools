import {CrawlResult} from '../../types';

interface AICrawlersTabProps {
  result: CrawlResult;
}

export function AICrawlersTab({result}: AICrawlersTabProps) {
  const aiCrawlers = result.phase1?.aiCrawlers;

  if (!aiCrawlers || aiCrawlers.length === 0) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400">
        AI crawler analysis not available. Enter a URL to analyze.
      </div>
    );
  }

  const blocked = aiCrawlers.filter((r) => !r.canAccess);
  const withIssues = aiCrawlers.filter((r) => r.issues.length > 0);
  const clean = aiCrawlers.filter((r) => r.canAccess && r.issues.length === 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">AI Crawler Access Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-emerald-400">{clean.length}</div>
            <div className="text-[11px] text-emerald-300/70">Full Access</div>
          </div>
          <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-amber-400">{withIssues.length - blocked.length}</div>
            <div className="text-[11px] text-amber-300/70">With Issues</div>
          </div>
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-400">{blocked.length}</div>
            <div className="text-[11px] text-red-300/70">Blocked</div>
          </div>
        </div>
      </div>

      {/* Individual Crawler Results */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">AI Crawler Details</h3>
        <div className="space-y-3">
          {aiCrawlers.map((crawler, i) => (
            <div key={i} className="bg-slate-800/50 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                    crawler.canAccess ? 'bg-emerald-600' : 'bg-red-600'
                  }`}>
                    {crawler.crawler.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{crawler.crawler}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{crawler.userAgent}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {crawler.canAccess ? (
                    <span className="px-2 py-1 text-[10px] bg-emerald-900/30 text-emerald-400 rounded">Allowed</span>
                  ) : (
                    <span className="px-2 py-1 text-[10px] bg-red-900/30 text-red-400 rounded">Blocked</span>
                  )}
                  {crawler.seesContent ? (
                    <span className="px-2 py-1 text-[10px] bg-emerald-900/30 text-emerald-400 rounded">Sees Content</span>
                  ) : (
                    <span className="px-2 py-1 text-[10px] bg-amber-900/30 text-amber-400 rounded">Limited Content</span>
                  )}
                </div>
              </div>
              {crawler.issues.length > 0 && (
                <div className="p-3">
                  {crawler.issues.map((issue, j) => (
                    <div key={j} className="text-xs text-amber-300/80 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Key Insights</h3>
        <div className="space-y-2">
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">AI Crawlers Don't Execute JavaScript</div>
            <div className="text-sm text-white">
              GPTBot, ClaudeBot, PerplexityBot, and other AI crawlers fetch raw HTML only. If your content requires JavaScript to render, AI crawlers will not see it.
            </div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">robots.txt Affects AI Visibility</div>
            <div className="text-sm text-white">
              Blocking AI crawlers in robots.txt prevents them from accessing your content for AI-generated answers and citations.
            </div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">SSR/SSG is Critical for AI</div>
            <div className="text-sm text-white">
              Server-side rendering ensures AI crawlers can access your content without executing JavaScript. This is the single most important factor for AI visibility.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
