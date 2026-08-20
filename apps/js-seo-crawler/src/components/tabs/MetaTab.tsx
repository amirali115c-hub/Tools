import {CrawlResult} from '../../types';

interface MetaTabProps {
  result: CrawlResult;
}

export function MetaTab({result}: MetaTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Core Meta Tags</h3>
        <div className="space-y-2">
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-slate-400">Title</span>
              {result.title ? (
                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-900/30 text-emerald-400 rounded">OK</span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] bg-red-900/30 text-red-400 rounded">Missing</span>
              )}
            </div>
            <p className="text-sm text-white break-all">{result.title || 'No title tag found'}</p>
            {result.title && (
              <p className="text-[11px] text-slate-500 mt-1">{result.title.length} characters</p>
            )}
          </div>

          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-slate-400">Meta Description</span>
              {result.metaDescription ? (
                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-900/30 text-emerald-400 rounded">OK</span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] bg-red-900/30 text-red-400 rounded">Missing</span>
              )}
            </div>
            <p className="text-sm text-white break-all">{result.metaDescription || 'No meta description found'}</p>
            {result.metaDescription && (
              <p className="text-[11px] text-slate-500 mt-1">{result.metaDescription.length} characters</p>
            )}
          </div>

          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-slate-400">Canonical</span>
              {result.canonical ? (
                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-900/30 text-emerald-400 rounded">OK</span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] bg-amber-900/30 text-amber-400 rounded">Missing</span>
              )}
            </div>
            <p className="text-sm text-white break-all">{result.canonical || 'No canonical tag found'}</p>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-slate-400">Robots</span>
            </div>
            <p className="text-sm text-white">{result.robots || 'Not set (default: index, follow)'}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">All Meta Tags ({result.metaTags.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Name/Property</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Content</th>
              </tr>
            </thead>
            <tbody>
              {result.metaTags.map((meta, i) => (
                <tr key={i} className="border-b border-slate-800">
                  <td className="py-2 px-3 text-slate-300 font-mono">
                    {meta.name || meta.property || meta.httpEquiv || meta.charset || '(unknown)'}
                  </td>
                  <td className="py-2 px-3 text-white break-all max-w-xs truncate">
                    {meta.content || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
