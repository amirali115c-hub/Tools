import {CrawlResult} from '../../types';

interface OverviewTabProps {
  result: CrawlResult;
}

export function OverviewTab({result}: OverviewTabProps) {
  const errors = result.issues.filter((i) => i.type === 'error');
  const warnings = result.issues.filter((i) => i.type === 'warning');
  const infos = result.issues.filter((i) => i.type === 'info');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Basic Information</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
            <span className="text-xs text-slate-400 w-24 shrink-0">Title</span>
            <span className={`text-sm ${result.title ? 'text-white' : 'text-red-400'}`}>
              {result.title || 'Missing'}
            </span>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
            <span className="text-xs text-slate-400 w-24 shrink-0">Description</span>
            <span className={`text-sm ${result.metaDescription ? 'text-white' : 'text-red-400'}`}>
              {result.metaDescription || 'Missing'}
            </span>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
            <span className="text-xs text-slate-400 w-24 shrink-0">Canonical</span>
            <span className={`text-sm ${result.canonical ? 'text-white' : 'text-amber-400'}`}>
              {result.canonical || 'Not set'}
            </span>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
            <span className="text-xs text-slate-400 w-24 shrink-0">Robots</span>
            <span className="text-sm text-white">{result.robots || 'Not set (default: index, follow)'}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Page Stats</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{result.wordCount.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400">Words</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{(result.htmlSize / 1024).toFixed(1)}KB</div>
            <div className="text-[11px] text-slate-400">HTML Size</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{result.loadTime}ms</div>
            <div className="text-[11px] text-slate-400">Load Time</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Issues Summary</h3>
        {result.issues.length === 0 ? (
          <div className="p-3 bg-emerald-900/20 border border-emerald-800 rounded-lg text-sm text-emerald-400">
            No issues found
          </div>
        ) : (
          <div className="space-y-2">
            {errors.length > 0 && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <div className="text-xs font-medium text-red-400 mb-1">{errors.length} Error{errors.length !== 1 ? 's' : ''}</div>
                {errors.slice(0, 3).map((e, i) => (
                  <div key={i} className="text-xs text-red-300/80">{e.message}</div>
                ))}
                {errors.length > 3 && (
                  <div className="text-xs text-red-400/60 mt-1">+{errors.length - 3} more</div>
                )}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg">
                <div className="text-xs font-medium text-amber-400 mb-1">{warnings.length} Warning{warnings.length !== 1 ? 's' : ''}</div>
                {warnings.slice(0, 3).map((w, i) => (
                  <div key={i} className="text-xs text-amber-300/80">{w.message}</div>
                ))}
                {warnings.length > 3 && (
                  <div className="text-xs text-amber-400/60 mt-1">+{warnings.length - 3} more</div>
                )}
              </div>
            )}
            {infos.length > 0 && (
              <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div className="text-xs font-medium text-slate-400 mb-1">{infos.length} Info</div>
                {infos.slice(0, 3).map((info, i) => (
                  <div key={i} className="text-xs text-slate-300/80">{info.message}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
