import {CrawlResult} from '../../types';

interface IssuesTabProps {
  result: CrawlResult;
}

export function IssuesTab({result}: IssuesTabProps) {
  const errors = result.issues.filter((i) => i.type === 'error');
  const warnings = result.issues.filter((i) => i.type === 'warning');
  const infos = result.issues.filter((i) => i.type === 'info');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Issues Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-400">{errors.length}</div>
            <div className="text-[11px] text-red-300/70">Errors</div>
          </div>
          <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-amber-400">{warnings.length}</div>
            <div className="text-[11px] text-amber-300/70">Warnings</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-slate-400">{infos.length}</div>
            <div className="text-[11px] text-slate-400">Info</div>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-400 mb-3">Errors ({errors.length})</h3>
          <div className="space-y-2">
            {errors.map((issue, i) => (
              <div key={i} className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 text-[10px] bg-red-900/50 text-red-400 rounded font-medium">
                    {issue.category}
                  </span>
                </div>
                <p className="text-sm text-red-300">{issue.message}</p>
                {issue.value && (
                  <p className="text-xs text-red-400/60 mt-1 font-mono">{issue.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-400 mb-3">Warnings ({warnings.length})</h3>
          <div className="space-y-2">
            {warnings.map((issue, i) => (
              <div key={i} className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-900/50 text-amber-400 rounded font-medium">
                    {issue.category}
                  </span>
                </div>
                <p className="text-sm text-amber-300">{issue.message}</p>
                {issue.value && (
                  <p className="text-xs text-amber-400/60 mt-1 font-mono">{issue.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {infos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Info ({infos.length})</h3>
          <div className="space-y-2">
            {infos.map((issue, i) => (
              <div key={i} className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-400 rounded font-medium">
                    {issue.category}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{issue.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.issues.length === 0 && (
        <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg text-center">
          <p className="text-sm text-emerald-400">No issues found. This page looks good!</p>
        </div>
      )}
    </div>
  );
}
