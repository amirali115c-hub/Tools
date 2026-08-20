import {CrawlResult} from '../../types';

interface CWVTabProps {
  result: CrawlResult;
}

export function CWVTab({result}: CWVTabProps) {
  const cwv = result.cwv;

  if (!cwv) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400">
        Core Web Vitals data not available. Enter a URL to analyze.
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getMetricColor = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'text-emerald-400';
    if (value <= thresholds[1]) return 'text-amber-400';
    return 'text-red-400';
  };

  const getMetricStatus = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'Good';
    if (value <= thresholds[1]) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Performance Score</h3>
        <div className="bg-slate-800/50 rounded-lg p-6 text-center">
          <div className={`text-5xl font-bold ${getScoreColor(cwv.score || 0)}`}>
            {cwv.score || 'N/A'}
          </div>
          <div className="text-sm text-slate-400 mt-2">PageSpeed Insights Score</div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Core Web Vitals</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">LCP</div>
            <div className={`text-2xl font-bold ${getMetricColor(cwv.lcp || 0, [2.5, 4.0])}`}>
              {cwv.lcp ? `${cwv.lcp.toFixed(1)}s` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500">Largest Contentful Paint</div>
            <div className={`text-[10px] mt-1 ${getMetricColor(cwv.lcp || 0, [2.5, 4.0])}`}>
              {cwv.lcp ? getMetricStatus(cwv.lcp, [2.5, 4.0]) : ''}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">INP</div>
            <div className={`text-2xl font-bold ${getMetricColor(cwv.inp || 0, [200, 500])}`}>
              {cwv.inp ? `${cwv.inp}ms` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500">Interaction to Next Paint</div>
            <div className={`text-[10px] mt-1 ${getMetricColor(cwv.inp || 0, [200, 500])}`}>
              {cwv.inp ? getMetricStatus(cwv.inp, [200, 500]) : ''}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">CLS</div>
            <div className={`text-2xl font-bold ${getMetricColor(cwv.cls || 0, [0.1, 0.25])}`}>
              {cwv.cls ? cwv.cls.toFixed(3) : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500">Cumulative Layout Shift</div>
            <div className={`text-[10px] mt-1 ${getMetricColor(cwv.cls || 0, [0.1, 0.25])}`}>
              {cwv.cls ? getMetricStatus(cwv.cls, [0.1, 0.25]) : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Additional Metrics</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">FCP</div>
            <div className="text-lg font-bold text-white">
              {cwv.fcp ? `${cwv.fcp.toFixed(1)}s` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500">First Contentful Paint</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">TTFB</div>
            <div className="text-lg font-bold text-white">
              {cwv.ttfb ? `${cwv.ttfb.toFixed(1)}s` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500">Time to First Byte</div>
          </div>
        </div>
      </div>

      {/* Opportunities */}
      {cwv.opportunities && cwv.opportunities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Optimization Opportunities</h3>
          <div className="space-y-2">
            {cwv.opportunities.map((opp, i) => (
              <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{opp.metric}</span>
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-900/30 text-emerald-400 rounded">
                    {opp.savings}
                  </span>
                </div>
                <div className="text-xs text-slate-400">{opp.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CWV Thresholds */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">CWV Thresholds (2026)</h3>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 text-slate-400 font-medium">Metric</th>
                <th className="text-left py-2 text-slate-400 font-medium">Good</th>
                <th className="text-left py-2 text-slate-400 font-medium">Needs Improvement</th>
                <th className="text-left py-2 text-slate-400 font-medium">Poor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800">
                <td className="py-2 text-white">LCP</td>
                <td className="py-2 text-emerald-400">≤ 2.5s</td>
                <td className="py-2 text-amber-400">≤ 4.0s</td>
                  <td className="py-2 text-red-400">&gt; 4.0s</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 text-white">INP</td>
                <td className="py-2 text-emerald-400">≤ 200ms</td>
                <td className="py-2 text-amber-400">≤ 500ms</td>
                  <td className="py-2 text-red-400">&gt; 500ms</td>
              </tr>
              <tr>
                <td className="py-2 text-white">CLS</td>
                <td className="py-2 text-emerald-400">≤ 0.1</td>
                <td className="py-2 text-amber-400">≤ 0.25</td>
                  <td className="py-2 text-red-400">&gt; 0.25</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
