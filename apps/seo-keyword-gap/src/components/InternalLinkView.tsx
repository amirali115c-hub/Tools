import React from 'react';
import { ClassifiedPage, GapOpportunity } from '../types';
import { detectCannibalization, generateInternalLinkRecommendations } from '../utils/internalLinkEngine';
import { Network, AlertOctagon, Link2, ArrowRight, ShieldAlert, CheckCircle, Download, FileText, Layers } from 'lucide-react';
import Papa from 'papaparse';

interface InternalLinkViewProps {
  ownPages: ClassifiedPage[];
  gaps: GapOpportunity[];
}

export const InternalLinkView: React.FC<InternalLinkViewProps> = ({
  ownPages,
  gaps
}) => {
  const cannibalizationAlerts = detectCannibalization(ownPages);
  const linkRecommendations = generateInternalLinkRecommendations(ownPages, gaps);

  const exportLinkMatrixCsv = () => {
    const rows = linkRecommendations.map(r => ({
      'Source Page URL': r.sourceUrl,
      'Source Title': r.sourceTitle,
      'Target Page URL': r.targetUrl,
      'Target Title': r.targetTitle,
      'Suggested Anchor Text': r.suggestedAnchorText,
      'Relevancy Score': `${r.relevancyScore}%`,
      'Target Type': r.targetType,
      'Placement Guidance': r.placementContext
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Internal-Link-Network-Plan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Network className="w-3 h-3 text-emerald-400" /> Milestone 3 • Link Architecture & Cannibalization
            </span>
            <span className="text-xs text-slate-400">Hub & Spoke Internal Link Network</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            Cannibalization Detector & Internal Link Network
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Detect competing pages splitting search rankings, and build an authoritative internal link flow to pass PageRank to high-value service pillars and new content gaps.
          </p>
        </div>

        <button
          onClick={exportLinkMatrixCsv}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" /> Export Link Plan (.csv)
        </button>
      </div>

      {/* 1. Cannibalization Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-600" />
              Keyword Cannibalization Detector ({cannibalizationAlerts.length} Alerts)
            </h3>
            <p className="text-xs text-slate-500">
              Multiple pages on your site competing for the exact same target keywords
            </p>
          </div>

          {cannibalizationAlerts.length === 0 ? (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> No Cannibalization Detected
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Resolution Required
            </span>
          )}
        </div>

        {cannibalizationAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Great news! None of your analyzed pages have conflicting primary keywords. Your ranking signals are clean.
          </div>
        ) : (
          <div className="space-y-3">
            {cannibalizationAlerts.map(alert => (
              <div key={alert.id} className="p-4 border border-amber-200 bg-amber-50/40 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold bg-amber-600 text-white px-2 py-0.5 rounded uppercase">
                      {alert.riskLevel} Risk
                    </span>
                    <h4 className="font-bold text-xs text-slate-900">
                      Target Keyword: <span className="text-indigo-700 font-mono">"{alert.keyword}"</span>
                    </h4>
                  </div>

                  <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-200 px-3 py-1 rounded-lg">
                    Action: {alert.recommendedAction}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  {alert.impactDescription}
                </p>

                <div className="bg-white border border-amber-200 rounded-lg p-3 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Competing Pages ({alert.competingPages.length}):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {alert.competingPages.map((cp, idx) => (
                      <div key={idx} className="p-2 border border-slate-200 rounded-md bg-slate-50 flex items-center justify-between">
                        <div className="truncate max-w-[240px]">
                          <strong className="text-slate-900 block truncate">{cp.title}</strong>
                          <span className="text-[10px] text-slate-400 font-mono truncate block">{cp.url}</span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {cp.category.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Recommended Internal Link Network */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-600" />
              Recommended Internal Link Insertions ({linkRecommendations.length})
            </h3>
            <p className="text-xs text-slate-500">
              Optimal contextual link bridges connecting blog posts to core service pillars and new gap pages
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {linkRecommendations.map(rec => (
            <div key={rec.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-2 text-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                {/* Link Flow */}
                <div className="flex items-center gap-3 flex-1">
                  
                  {/* Source */}
                  <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 max-w-xs space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Source Page</span>
                    <div className="font-bold text-slate-900 truncate" title={rec.sourceTitle}>{rec.sourceTitle}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{rec.sourceUrl}</div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />

                  {/* Target */}
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl max-w-xs space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Target ({rec.targetType})</span>
                    <div className="font-bold text-slate-900 truncate" title={rec.targetTitle}>{rec.targetTitle}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{rec.targetUrl}</div>
                  </div>

                </div>

                {/* Suggested Anchor */}
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl shrink-0 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Suggested Anchor Text</span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg block font-mono">
                    "{rec.suggestedAnchorText}"
                  </span>
                </div>

              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                <span><strong>Context Guidance:</strong> {rec.placementContext}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                  {rec.relevancyScore}% Relevance
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
