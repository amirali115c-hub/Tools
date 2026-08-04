import React, { useState } from 'react';
import { DiagnosticIssue } from '../types';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface DiagnosticsPanelProps {
  diagnostics: DiagnosticIssue[];
  onHighlightLine?: (lineNumber: number | null) => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  diagnostics,
  onHighlightLine,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const counts = {
    critical: diagnostics.filter((d) => d.severity === 'critical').length,
    warning: diagnostics.filter((d) => d.severity === 'warning').length,
    syntax: diagnostics.filter((d) => d.severity === 'syntax').length,
    notice: diagnostics.filter((d) => d.severity === 'notice').length,
  };

  const filtered = diagnostics.filter((d) => {
    if (filterSeverity === 'all') return true;
    return d.severity === filterSeverity;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-slate-100 text-sm tracking-wide">
            SEO & Syntax Audit Diagnostics ({diagnostics.length})
          </h2>
        </div>

        {/* Severity Filter Badges */}
        <div className="flex items-center space-x-1.5 flex-wrap">
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterSeverity === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            All ({diagnostics.length})
          </button>

          {counts.critical > 0 && (
            <button
              onClick={() => setFilterSeverity('critical')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filterSeverity === 'critical'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Critical ({counts.critical})
            </button>
          )}

          {counts.warning > 0 && (
            <button
              onClick={() => setFilterSeverity('warning')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filterSeverity === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Warning ({counts.warning})
            </button>
          )}

          {counts.syntax > 0 && (
            <button
              onClick={() => setFilterSeverity('syntax')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filterSeverity === 'syntax'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-950/60 text-sky-300 border border-sky-800/60'
              }`}
            >
              <Info className="w-3 h-3" />
              Syntax ({counts.syntax})
            </button>
          )}
        </div>
      </div>

      {/* Diagnostics List */}
      {filtered.length === 0 ? (
        <div className="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">
            No issues found under this filter!
          </h3>
          <p className="text-xs text-slate-400">
            Your robots.txt file passes all key RFC 9309 and Googlebot syntax audits.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {filtered.map((issue) => {
            const severityStyles = {
              critical:
                'bg-rose-950/30 border-rose-500/40 text-rose-200 hover:border-rose-500/70',
              warning:
                'bg-amber-950/30 border-amber-500/40 text-amber-200 hover:border-amber-500/70',
              syntax:
                'bg-sky-950/30 border-sky-500/40 text-sky-200 hover:border-sky-500/70',
              notice:
                'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600',
            }[issue.severity];

            const badgeStyles = {
              critical: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
              warning: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              syntax: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
              notice: 'bg-slate-700 text-slate-300 border-slate-600',
            }[issue.severity];

            return (
              <div
                key={issue.id}
                className={`p-3.5 rounded-xl border transition-all space-y-2 ${severityStyles}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5">
                    {issue.severity === 'critical' && (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    {issue.severity === 'warning' && (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    {issue.severity === 'syntax' && (
                      <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    )}
                    {issue.severity === 'notice' && (
                      <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyles}`}
                        >
                          {issue.severity}
                        </span>
                        <h3 className="font-bold text-xs text-slate-100">
                          {issue.title}
                        </h3>
                      </div>
                      <p className="text-xs font-mono font-medium text-slate-200 pt-0.5">
                        {issue.message}
                      </p>
                    </div>
                  </div>

                  {issue.lineNumber && (
                    <button
                      onClick={() => onHighlightLine?.(issue.lineNumber!)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono rounded-lg border border-slate-700 flex items-center space-x-1 shrink-0 transition-colors"
                      title="Jump to line in code editor"
                    >
                      <span>Line {issue.lineNumber}</span>
                      <ArrowRight className="w-3 h-3 text-indigo-400" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300/90 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
                  <strong className="text-slate-200">SEO Impact:</strong>{' '}
                  {issue.explanation}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
