import React, { useState } from 'react';
import { AuditIssue, Severity } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface IssueCardProps {
  issue: AuditIssue;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'pass':
        return {
          bg: 'bg-emerald-50 text-slate-900 border-slate-900',
          badgeBg: 'bg-emerald-600 text-white border-slate-900',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 stroke-[2.5]" />,
          label: 'PASS',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 text-slate-900 border-slate-900',
          badgeBg: 'bg-amber-500 text-slate-950 border-slate-900',
          icon: <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 stroke-[2.5]" />,
          label: 'WARNING',
        };
      case 'fail':
        return {
          bg: 'bg-rose-50 text-slate-900 border-slate-900',
          badgeBg: 'bg-rose-600 text-white border-slate-900',
          icon: <XCircle className="w-6 h-6 text-rose-700 shrink-0 stroke-[2.5]" />,
          label: 'HARD ERROR',
        };
      case 'unverified':
        return {
          bg: 'bg-purple-50 text-slate-900 border-slate-900',
          badgeBg: 'bg-purple-600 text-white border-slate-900',
          icon: <HelpCircle className="w-6 h-6 text-purple-700 shrink-0 stroke-[2.5]" />,
          label: 'UNVERIFIED (CORS)',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-900 border-slate-900',
          badgeBg: 'bg-slate-900 text-white border-slate-900',
          icon: <Info className="w-6 h-6 text-slate-800 shrink-0 stroke-[2.5]" />,
          label: 'INFO',
        };
    }
  };

  const style = getSeverityBadge(issue.severity);

  const handleCopyTag = () => {
    navigator.clipboard.writeText(issue.extractedTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border-4 border-slate-900 p-4 sm:p-5 transition-all shadow-md ${style.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {style.icon}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 border-2 ${style.badgeBg}`}>
                {style.label}
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                {issue.category.replace('_', ' ')}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight leading-snug">
              {issue.title}
            </h4>
            <p className="text-sm font-bold text-slate-800 mt-1 leading-relaxed">
              {issue.summary}
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 border-2 border-slate-900 bg-white hover:bg-slate-900 hover:text-white text-slate-900 transition-colors shrink-0 cursor-pointer shadow-xs"
          title={expanded ? 'Collapse details' : 'Expand details'}
        >
          {expanded ? <ChevronUp className="w-5 h-5 stroke-[2.5]" /> : <ChevronDown className="w-5 h-5 stroke-[2.5]" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-3 border-t-2 border-slate-900 space-y-3">
          {/* Extracted Tag Box */}
          {issue.extractedTag && issue.extractedTag !== 'None' && (
            <div>
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 mb-1">
                <span>EXTRACTED TAG / SIGNAL:</span>
                <button
                  onClick={handleCopyTag}
                  className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Copy snippet</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 border-2 border-slate-900 bg-slate-950 text-emerald-400 text-xs font-mono font-bold overflow-x-auto whitespace-pre-wrap break-all shadow-xs">
                <code>{issue.extractedTag}</code>
              </pre>
            </div>
          )}

          {/* Parsed Meaning & SEO Consequence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 border-2 border-slate-900 bg-white font-medium text-slate-900 shadow-xs">
              <span className="font-black text-slate-900 uppercase tracking-wide block mb-1">
                Parsed Meaning:
              </span>
              <span className="text-slate-800 font-semibold">{issue.parsedMeaning}</span>
            </div>

            <div className="p-3.5 border-2 border-slate-900 bg-white font-medium text-slate-900 shadow-xs">
              <span className="font-black text-slate-900 uppercase tracking-wide block mb-1">
                SEO Consequence:
              </span>
              <span className="text-slate-800 font-semibold">{issue.seoConsequence}</span>
            </div>
          </div>

          {/* Recommended Action */}
          {issue.recommendedAction && (
            <div className="p-3.5 border-2 border-slate-900 bg-emerald-100 text-slate-950 text-xs sm:text-sm font-semibold shadow-xs">
              <span className="font-black uppercase tracking-wide block mb-1 text-emerald-950">Recommended Action:</span>
              <span>{issue.recommendedAction}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

