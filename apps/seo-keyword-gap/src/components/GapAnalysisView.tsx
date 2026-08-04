import React, { useState } from 'react';
import { GapOpportunity } from '../types';
import { Target, CheckSquare, FileText, Download, Sparkles, AlertCircle, ArrowRight, ExternalLink, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { exportPlanToCsv, exportWriterBriefsMarkdown } from '../utils/export';

interface GapAnalysisViewProps {
  gaps: GapOpportunity[];
  ownPageCount: number;
  competitorPageCount: number;
  onProceedToPlan: () => void;
}

export const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({
  gaps,
  ownPageCount,
  competitorPageCount,
  onProceedToPlan
}) => {
  const [selectedGapId, setSelectedGapId] = useState<string | null>(gaps[0]?.id || null);
  const [ignoredGapIds, setIgnoredGapIds] = useState<Set<string>>(new Set());

  const activeGaps = gaps.filter(g => !ignoredGapIds.has(g.id));
  const activeGap = activeGaps.find(g => g.id === selectedGapId) || activeGaps[0];

  const toggleIgnoreGap = (id: string) => {
    const next = new Set(ignoredGapIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setIgnoredGapIds(next);
  };

  if (competitorPageCount === 0 || ownPageCount === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-2xl mx-auto shadow-sm my-8 space-y-4">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Both Competitor and Own Site Pages Required</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Gap analysis compares competitor service & blog keywords against your existing site. You currently have {competitorPageCount} competitor pages and {ownPageCount} own site pages loaded.
        </p>
        <div className="pt-2">
          <p className="text-xs text-indigo-600 font-semibold mb-3">
            Tip: Go back to Data Intake or load 1-Click Demo Data to test instantly!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Strategic Gap Analysis
            </span>
            <span className="text-xs text-slate-400">
              Comparing competitor keywords vs. your site coverage
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            {activeGaps.length} Missing Page Opportunities Uncovered
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Rather than blindly copying competitor terms, these gaps highlight missing service pages and editorial guides that your competitors target but your site completely lacks.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportWriterBriefsMarkdown([], activeGaps)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Markdown Briefs
          </button>
        </div>
      </div>

      {activeGaps.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No Unaddressed Gaps Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your site currently has service or blog content matching all key competitor topics, or all flagged gaps have been ignored.
          </p>
        </div>
      ) : (
        /* Main 2-Column Professional Polish Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (5 cols): Opportunity Gap List */}
          <div className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Recommended New Pages</h3>
                <span className="text-[10px] text-slate-500">Select a gap to view detailed writer brief</span>
              </div>
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                {activeGaps.length} Gaps
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
              {activeGaps.map(gap => {
                const isSelected = activeGap?.id === gap.id;
                const isService = gap.suggestedPageType === 'service';

                return (
                  <div
                    key={gap.id}
                    onClick={() => setSelectedGapId(gap.id)}
                    className={`p-4 transition-all cursor-pointer border-l-4 ${
                      isSelected
                        ? 'bg-indigo-50/40 border-l-indigo-600 shadow-inner'
                        : 'border-l-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isService ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {gap.suggestedPageType.toUpperCase()} GAP
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {gap.workingTitle}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        {gap.isVolumeBacked && gap.searchVolume ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            {gap.searchVolume.toLocaleString()}/mo
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            TF-IDF Gap
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono text-indigo-600 font-semibold">
                        /{gap.suggestedSlug}
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (7 cols): Implementation Brief & Placement Checklist */}
          {activeGap && (
            <div className="lg:col-span-7 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Content Brief Blueprint
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Ready to assign to copywriter
                  </span>
                </div>
                
                <h2 className="text-lg font-bold text-slate-900">
                  {activeGap.workingTitle}
                </h2>
                
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-slate-500">
                    Proposed URL: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-indigo-600">/{activeGap.suggestedPageType === 'service' ? 'services' : 'blog'}/{activeGap.suggestedSlug}</code>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold text-slate-700">
                    Target Primary: <mark className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">{activeGap.targetPrimaryKeyword}</mark>
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[550px]">
                
                {/* Secondary Keywords */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Secondary Target Keywords
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeGap.targetSecondaryKeywords.map((sec, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Analysis Rationale */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Strategic Rationale & Competitor Evidence
                  </h4>
                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    "{activeGap.reasoning}"
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Competitor Page:</span>
                    <a href={activeGap.competitorPageUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-mono underline truncate max-w-xs">
                      {activeGap.competitorPageUrl}
                    </a>
                  </div>
                </div>

                {/* Placement Checklist */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Exact On-Page Placement Checklist
                    </h4>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      6 Recommended Placement Targets
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeGap.placementChecklist.map((item, idx) => (
                      <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-white space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{item.element}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.importance === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {item.importance.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {item.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                <button
                  onClick={() => toggleIgnoreGap(activeGap.id)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Dismiss / Ignore Gap
                </button>
                <button
                  onClick={onProceedToPlan}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg shadow-sm transition-colors cursor-pointer text-center"
                >
                  View Full Targeting Master Plan
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
