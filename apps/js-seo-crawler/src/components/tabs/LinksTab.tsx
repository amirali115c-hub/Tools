import {CrawlResult} from '../../types';

interface LinksTabProps {
  result: CrawlResult;
}

export function LinksTab({result}: LinksTabProps) {
  const internalLinks = result.links.filter((l) => l.isInternal);
  const externalLinks = result.links.filter((l) => !l.isInternal);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Link Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{result.links.length}</div>
            <div className="text-[11px] text-slate-400">Total Links</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-emerald-400">{internalLinks.length}</div>
            <div className="text-[11px] text-slate-400">Internal</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-amber-400">{externalLinks.length}</div>
            <div className="text-[11px] text-slate-400">External</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Internal Links ({internalLinks.length})</h3>
        {internalLinks.length === 0 ? (
          <div className="p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">No internal links found</div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {internalLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-white truncate flex-1" title={link.href}>{link.href}</span>
                <span className="text-slate-500 truncate max-w-[200px]" title={link.text}>{link.text || '(no text)'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">External Links ({externalLinks.length})</h3>
        {externalLinks.length === 0 ? (
          <div className="p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">No external links found</div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {externalLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                <span className="text-white truncate flex-1" title={link.href}>{link.href}</span>
                <span className="text-slate-500 truncate max-w-[200px]" title={link.text}>{link.text || '(no text)'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
