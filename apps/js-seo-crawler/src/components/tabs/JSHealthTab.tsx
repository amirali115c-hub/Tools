import {CrawlResult} from '../../types';

interface JSHealthTabProps {
  result: CrawlResult;
}

export function JSHealthTab({result}: JSHealthTabProps) {
  const jsHealth = result.jsHealth;

  if (!jsHealth) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400">
        JavaScript health data not available. Enter a URL to analyze.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">JavaScript Health Summary</h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${jsHealth.consoleErrors.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {jsHealth.consoleErrors.length}
            </div>
            <div className="text-[11px] text-slate-400">Console Errors</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${jsHealth.consoleWarnings.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {jsHealth.consoleWarnings.length}
            </div>
            <div className="text-[11px] text-slate-400">Warnings</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${jsHealth.hydrationMismatches.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {jsHealth.hydrationMismatches.length}
            </div>
            <div className="text-[11px] text-slate-400">Hydration Issues</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${jsHealth.dynamicImports.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {jsHealth.dynamicImports.length}
            </div>
            <div className="text-[11px] text-slate-400">Dynamic Imports</div>
          </div>
        </div>
      </div>

      {/* Console Errors */}
      {jsHealth.consoleErrors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Console Errors</h3>
          <div className="space-y-2">
            {jsHealth.consoleErrors.map((error, i) => (
              <div key={i} className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <div className="text-xs font-medium text-red-400 mb-1">Error {i + 1}</div>
                <div className="text-xs text-red-300/80 font-mono">{error}</div>
                <div className="text-[10px] text-red-400/60 mt-2">
                  SEO Impact: {error.includes('chunk') || error.includes('loading') ? 'HIGH - May prevent indexing' : 'MEDIUM - Review required'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Console Warnings */}
      {jsHealth.consoleWarnings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Console Warnings</h3>
          <div className="space-y-2">
            {jsHealth.consoleWarnings.map((warning, i) => (
              <div key={i} className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg">
                <div className="text-xs font-medium text-amber-400 mb-1">Warning {i + 1}</div>
                <div className="text-xs text-amber-300/80 font-mono">{warning}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hydration Mismatches */}
      {jsHealth.hydrationMismatches.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Hydration Mismatches</h3>
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg mb-3">
            <div className="text-xs text-red-300/80">
              Hydration mismatches occur when the server-rendered HTML differs from the client-rendered DOM.
              This can cause content to flash, disappear, or be duplicated. Search engines may index different content than users see.
            </div>
          </div>
          <div className="space-y-2">
            {jsHealth.hydrationMismatches.map((mismatch, i) => (
              <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Mismatch {i + 1}</div>
                <div className="text-xs text-white font-mono">{mismatch}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Imports */}
      {jsHealth.dynamicImports.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Dynamic Imports</h3>
          <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg mb-3">
            <div className="text-xs text-amber-300/80">
              Dynamic imports (React.lazy, import()) may delay content rendering. If critical content is in dynamic imports, crawlers may not see it.
            </div>
          </div>
          <div className="space-y-2">
            {jsHealth.dynamicImports.map((imp, i) => (
              <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-white font-mono">{imp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lazy Loading Issues */}
      {jsHealth.lazyLoadedAboveFold.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Lazy Loading Above the Fold</h3>
          <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg mb-3">
            <div className="text-xs text-amber-300/80">
              Images with loading="lazy" above the fold hurt Largest Contentful Paint (LCP). Move above-fold images to eager loading.
            </div>
          </div>
          <div className="space-y-2">
            {jsHealth.lazyLoadedAboveFold.map((img, i) => (
              <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-white">{img.src}</div>
                <div className="text-[10px] text-amber-400 mt-1">{img.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infinite Scroll & Client Routing */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">SPA Features Detected</h3>
        <div className="space-y-2">
          <div className={`p-3 rounded-lg border ${
            jsHealth.infiniteScrollDetected
              ? 'bg-amber-900/20 border-amber-800'
              : 'bg-slate-800/50 border-slate-700'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${jsHealth.infiniteScrollDetected ? 'bg-amber-500' : 'bg-slate-600'}`}></span>
              <span className="text-sm text-white">Infinite Scroll</span>
            </div>
            {jsHealth.infiniteScrollDetected && (
              <div className="text-xs text-amber-300/80 mt-2 ml-4">
                Infinite scroll detected. Ensure paginated URLs are crawlable and have proper pagination markup.
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg border ${
            jsHealth.clientSideRouting
              ? 'bg-blue-900/20 border-blue-800'
              : 'bg-slate-800/50 border-slate-700'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${jsHealth.clientSideRouting ? 'bg-blue-500' : 'bg-slate-600'}`}></span>
              <span className="text-sm text-white">Client-Side Routing</span>
            </div>
            {jsHealth.clientSideRouting && (
              <div className="text-xs text-blue-300/80 mt-2 ml-4">
                Client-side routing detected. Ensure all routes are accessible via direct URL navigation.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Recommendations</h3>
        <div className="space-y-2">
          {jsHealth.consoleErrors.length > 0 && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-xs text-red-300">
              Fix console errors that may prevent content from rendering. Check for chunk loading failures, API errors, or missing dependencies.
            </div>
          )}
          {jsHealth.hydrationMismatches.length > 0 && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-xs text-red-300">
              Fix hydration mismatches. Ensure server-rendered HTML matches client-rendered DOM. Use useEffect for client-only content.
            </div>
          )}
          {jsHealth.dynamicImports.length > 0 && (
            <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg text-xs text-amber-300">
              Review dynamic imports. Move critical SEO content from dynamic imports to static imports.
            </div>
          )}
          {jsHealth.lazyLoadedAboveFold.length > 0 && (
            <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg text-xs text-amber-300">
              Remove loading="lazy" from above-fold images. Use loading="lazy" only for below-fold content.
            </div>
          )}
          {jsHealth.infiniteScrollDetected && (
            <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-xs text-blue-300">
              Ensure infinite scroll has paginated fallback URLs that crawlers can access.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
