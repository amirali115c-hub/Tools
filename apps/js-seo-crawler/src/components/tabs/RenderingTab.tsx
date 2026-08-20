import {CrawlResult} from '../../types';

interface RenderingTabProps {
  result: CrawlResult;
}

export function RenderingTab({result}: RenderingTabProps) {
  const rendering = result.phase1?.rendering;

  if (!rendering) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400">
        Rendering analysis not available. Enter a URL to analyze.
      </div>
    );
  }

  const impactColors = {
    critical: 'bg-red-900/30 text-red-400 border-red-800',
    high: 'bg-orange-900/30 text-orange-400 border-orange-800',
    medium: 'bg-amber-900/30 text-amber-400 border-amber-800',
    low: 'bg-blue-900/30 text-blue-400 border-blue-800',
    none: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
  };

  return (
    <div className="space-y-6">
      {/* Framework Detection */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Framework Detection</h3>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {rendering.framework.framework.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{rendering.framework.framework}</div>
              <div className="text-xs text-slate-400">{rendering.framework.renderer}</div>
            </div>
            <div className="ml-auto">
              <span className="px-2 py-1 text-[10px] bg-indigo-900/30 text-indigo-400 rounded">
                {Math.round(rendering.framework.confidence * 100)}% confidence
              </span>
            </div>
          </div>
          {rendering.framework.router && (
            <div className="text-xs text-slate-400 mb-2">
              <span className="text-slate-500">Router:</span> {rendering.framework.router}
            </div>
          )}
          <div className="space-y-1">
            {rendering.framework.evidence.map((e, i) => (
              <div key={i} className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                {e}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rendering Strategy */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Rendering Strategy</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">Strategy</div>
            <div className="text-lg font-bold text-white">{rendering.strategy}</div>
            <div className="text-[11px] text-slate-500">{Math.round(rendering.confidence * 100)}% confidence</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">SEO Impact</div>
            <div className={`text-lg font-bold px-2 py-1 rounded border ${impactColors[rendering.seoImpact]}`}>
              {rendering.seoImpact.toUpperCase()}
            </div>
          </div>
        </div>
        <div className="mt-3 bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Impact Explanation</div>
          <div className="text-sm text-white">{rendering.seoImpactExplanation}</div>
        </div>
      </div>

      {/* Content Comparison */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Raw vs Rendered Content</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{(rendering.rawHtmlLength / 1024).toFixed(1)}KB</div>
            <div className="text-[11px] text-slate-400">Raw HTML</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{(rendering.renderedHtmlLength / 1024).toFixed(1)}KB</div>
            <div className="text-[11px] text-slate-400">Rendered HTML</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${rendering.contentDeltaPercent > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {rendering.contentDeltaPercent > 0 ? '+' : ''}{rendering.contentDeltaPercent}%
            </div>
            <div className="text-[11px] text-slate-400">Content Delta</div>
          </div>
        </div>
      </div>

      {/* Critical Differences */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Critical Differences</h3>
        <div className="space-y-2">
          {rendering.missingInRender.length > 0 && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <div className="text-xs font-medium text-red-400 mb-1">Missing from Raw HTML (only in rendered)</div>
              {rendering.missingInRender.map((item, i) => (
                <div key={i} className="text-xs text-red-300/80">{item}</div>
              ))}
            </div>
          )}
          {rendering.addedByJs.length > 0 && (
            <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg">
              <div className="text-xs font-medium text-amber-400 mb-1">Added by JavaScript</div>
              {rendering.addedByJs.map((item, i) => (
                <div key={i} className="text-xs text-amber-300/80">{item}</div>
              ))}
            </div>
          )}
          {rendering.linksOnlyAfterRender > 0 && (
            <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
              <div className="text-xs font-medium text-blue-400">
                {rendering.linksOnlyAfterRender} links only exist after JavaScript execution
              </div>
            </div>
          )}
          {rendering.imagesOnlyAfterRender > 0 && (
            <div className="p-3 bg-purple-900/20 border border-purple-800 rounded-lg">
              <div className="text-xs font-medium text-purple-400">
                {rendering.imagesOnlyAfterRender} images only load after JavaScript execution
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evidence */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Detection Evidence</h3>
        <div className="space-y-1">
          {rendering.evidence.map((e, i) => (
            <div key={i} className="text-xs text-slate-400 flex items-center gap-2 p-2 bg-slate-800/50 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {e}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {rendering.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Recommendations</h3>
          <div className="space-y-2">
            {rendering.recommendations.map((rec, i) => (
              <div key={i} className="p-3 bg-indigo-900/20 border border-indigo-800 rounded-lg text-xs text-indigo-300">
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
