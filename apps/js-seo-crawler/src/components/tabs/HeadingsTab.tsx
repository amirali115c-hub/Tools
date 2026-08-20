import {CrawlResult} from '../../types';

interface HeadingsTabProps {
  result: CrawlResult;
}

export function HeadingsTab({result}: HeadingsTabProps) {
  const h1Count = result.headings.filter((h) => h.level === 1).length;
  const h2Count = result.headings.filter((h) => h.level === 2).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Heading Summary</h3>
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((level) => {
            const count = result.headings.filter((h) => h.level === level).length;
            return (
              <div key={level} className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-white">{count}</div>
                <div className="text-[11px] text-slate-400">H{level}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Heading Hierarchy</h3>
        {result.headings.length === 0 ? (
          <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg text-sm text-amber-400">
            No headings found
          </div>
        ) : (
          <div className="space-y-1">
            {result.headings.map((heading, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
                style={{paddingLeft: `${(heading.level - 1) * 16 + 8}px`}}
              >
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                  heading.level === 1
                    ? 'bg-indigo-900/30 text-indigo-400'
                    : heading.level === 2
                    ? 'bg-emerald-900/30 text-emerald-400'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  H{heading.level}
                </span>
                <span className="text-sm text-white truncate">{heading.text || '(empty)'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Issues</h3>
        <div className="space-y-2">
          {h1Count === 0 && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-xs text-red-400">
              Missing H1 tag
            </div>
          )}
          {h1Count > 1 && (
            <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg text-xs text-amber-400">
              Multiple H1 tags found ({h1Count}). Use only one H1 per page.
            </div>
          )}
          {h2Count === 0 && h1Count > 0 && (
            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-slate-400">
              No H2 tags found. Consider adding subheadings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
