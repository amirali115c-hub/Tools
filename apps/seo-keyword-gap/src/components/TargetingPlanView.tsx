import React, { useState } from 'react';
import { ClassifiedPage, GapOpportunity, PlacementChecklist } from '../types';
import { generatePlacementChecklist } from '../utils/placementPlanner';
import { exportPlanToCsv, exportWriterBriefsMarkdown, exportKeywordsToCsv } from '../utils/export';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Download, FileSpreadsheet, FileText, Filter, Tag, Target, Sparkles, Layers, Key } from 'lucide-react';

interface TargetingPlanViewProps {
  ownPages: ClassifiedPage[];
  competitorPages?: ClassifiedPage[];
  gaps: GapOpportunity[];
}

export const TargetingPlanView: React.FC<TargetingPlanViewProps> = ({
  ownPages,
  competitorPages = [],
  gaps
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'service' | 'blog' | 'other'>('all');
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedPageId(expandedPageId === id ? null : id);
  };

  const filteredOwnPages = ownPages.filter(p => filterCategory === 'all' || p.category === filterCategory);
  const filteredGaps = gaps.filter(g => filterCategory === 'all' || g.suggestedPageType === filterCategory);

  const totalPagesCount = ownPages.length + gaps.length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & Export Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Final Output Plan
            </span>
            <span className="text-xs text-slate-400">
              {ownPages.length} Existing Pages • {gaps.length} Recommended New Pages
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            Page-by-Page Keyword Targeting & Placement Plan
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Exact keyword mapping and compliance checklists for your existing pages alongside new gap briefs ready to publish.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => exportKeywordsToCsv(competitorPages, ownPages, gaps)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Key className="w-4 h-4" /> Export All Keywords (.csv)
          </button>
          <button
            onClick={() => exportPlanToCsv(ownPages, gaps)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV Plan
          </button>
          <button
            onClick={() => exportWriterBriefsMarkdown(ownPages, gaps)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Export Writer Briefs (.md)
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Filter className="w-4 h-4 text-slate-400" /> Filter Plan by Page Type:
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              filterCategory === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Pages ({totalPagesCount})
          </button>
          <button
            onClick={() => setFilterCategory('service')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              filterCategory === 'service' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Service Pages
          </button>
          <button
            onClick={() => setFilterCategory('blog')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              filterCategory === 'blog' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Blog / Articles
          </button>
        </div>
      </div>

      {/* Recommended New Pages (Gaps) Section */}
      {filteredGaps.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-3 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Recommended New Pages to Publish ({filteredGaps.length})
              </h3>
              <p className="text-xs text-slate-500">
                New pages required to close keyword gap advantages held by competitors.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              New Content Opportunities
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {filteredGaps.map(gap => (
              <div key={gap.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 hover:border-indigo-300 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    gap.suggestedPageType === 'service' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {gap.suggestedPageType.toUpperCase()}
                  </span>
                  {gap.searchVolume && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Vol: {gap.searchVolume}/mo
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-slate-900 text-xs">
                  {gap.workingTitle}
                </h4>

                <div className="text-[11px] text-slate-600 font-mono">
                  Slug: <span className="text-indigo-600 font-semibold">/{gap.suggestedPageType === 'service' ? 'services' : 'blog'}/{gap.suggestedSlug}</span>
                </div>

                <div className="pt-1 flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-medium">Target Keyword:</span>
                  <span className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {gap.targetPrimaryKeyword}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Site Pages Targeting Master Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">
            Existing Page Keyword Targeting & On-Page Compliance
          </h3>
          <span className="text-xs text-slate-500">
            Showing {filteredOwnPages.length} pages
          </span>
        </div>

        {filteredOwnPages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No existing pages found for selected category filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Page Title & URL</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Assigned Target Keyword</th>
                  <th className="py-3 px-4 text-center">Compliance Score</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOwnPages.map(page => {
                  const checklist = generatePlacementChecklist(page);
                  const isExpanded = expandedPageId === page.metadata.id;

                  return (
                    <React.Fragment key={page.metadata.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        
                        <td className="py-3.5 px-4 max-w-xs space-y-0.5">
                          <div className="font-bold text-slate-900 truncate" title={page.metadata.title}>
                            {page.metadata.title || page.metadata.h1 || 'Untitled'}
                          </div>
                          <div className="text-slate-400 font-mono text-[11px] truncate">
                            {page.metadata.path}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                            page.category === 'service'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : page.category === 'blog'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {page.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {page.primaryKeyword ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-xs">
                              <Tag className="w-3 h-3 text-indigo-500" />
                              {page.primaryKeyword.term}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                            checklist.scorePercent >= 70
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : checklist.scorePercent >= 40
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {checklist.scorePercent}% Passed
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => toggleExpand(page.metadata.id)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer"
                          >
                            {isExpanded ? 'Hide Checklist' : 'Inspect Checklist'}
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                      </tr>

                      {/* Expanded Details Checklist Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={5} className="p-5">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                  Placement Checklist for Target Keyword: <span className="text-indigo-600">"{page.primaryKeyword?.term}"</span>
                                </h4>
                                <span className="text-xs text-slate-500">
                                  {checklist.items.filter(i => i.status === 'passed').length} / 6 Criteria Met
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {checklist.items.map((item, idx) => (
                                  <div key={idx} className={`p-3 rounded-lg border text-xs space-y-1 ${
                                    item.status === 'passed' ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/30 border-rose-200'
                                  }`}>
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                        {item.status === 'passed' ? (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-rose-500" />
                                        )}
                                        {item.element}
                                      </span>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                        item.status === 'passed' ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                                      }`}>
                                        {item.status}
                                      </span>
                                    </div>

                                    {item.currentText && (
                                      <div className="text-[11px] text-slate-500 font-mono truncate">
                                        Current: "{item.currentText}"
                                      </div>
                                    )}

                                    <p className="text-[11px] text-slate-700 font-medium pt-0.5">
                                      → {item.recommendation}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
