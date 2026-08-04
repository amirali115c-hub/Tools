import React, { useState } from 'react';
import { ClassifiedPage, PageCategory } from '../types';
import { exportKeywordsToCsv } from '../utils/export';
import { HelpCircle, AlertTriangle, CheckCircle, Search, ArrowRight, RefreshCw, FileText, Globe, Tag, Download, FileSpreadsheet } from 'lucide-react';

interface PageInventoryProps {
  competitorPages: ClassifiedPage[];
  ownPages: ClassifiedPage[];
  onCategoryOverride: (site: 'competitor' | 'own', pageId: string, category: PageCategory) => void;
  onProceedToGaps: () => void;
}

export const PageInventory: React.FC<PageInventoryProps> = ({
  competitorPages,
  ownPages,
  onCategoryOverride,
  onProceedToGaps
}) => {
  const [selectedSite, setSelectedSite] = useState<'competitor' | 'own'>('competitor');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PageCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const pagesToDisplay = selectedSite === 'competitor' ? competitorPages : ownPages;

  const filteredPages = pagesToDisplay.filter(p => {
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch =
      !searchTerm ||
      p.metadata.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.metadata.h1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.primaryKeyword?.term || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCat && matchesSearch;
  });

  const isSmallPageSet = pagesToDisplay.length > 0 && pagesToDisplay.length < 4;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Controls: Site Toggle & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Site Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedSite('competitor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSite === 'competitor'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" /> Competitor Pages ({competitorPages.length})
            </button>
            <button
              onClick={() => setSelectedSite('own')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSite === 'own'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" /> Own Site Pages ({ownPages.length})
            </button>
          </div>

          {/* Search & Category Filter & Export */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => exportKeywordsToCsv(competitorPages, ownPages, [])}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Download all primary and secondary extracted keywords into CSV"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Keywords (.csv)
            </button>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search URL, title, or keyword..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl w-56 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">All Categories</option>
              <option value="service">Service Pages</option>
              <option value="blog">Blog / Articles</option>
              <option value="other">Other / Utility</option>
            </select>
          </div>

        </div>

        {/* Small Page Set Warning */}
        {isSmallPageSet && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Small Page Set Notice ({pagesToDisplay.length} pages):</span> TF-IDF distinctiveness scoring relies on larger page sets. Using weighted term-frequency fallback. Add more pages for maximum keyword accuracy.
            </div>
          </div>
        )}
      </div>

      {/* Pages Table */}
      {filteredPages.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <FileText className="w-8 h-8 mx-auto text-slate-300" />
          <p className="font-semibold text-sm">No pages found for this selection.</p>
          <p className="text-xs">Add pages in Step 1 or clear search filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold tracking-wider uppercase">
                  <th className="py-3.5 px-4">Page Title & URL</th>
                  <th className="py-3.5 px-4">Category Classification</th>
                  <th className="py-3.5 px-4">Primary Target Keyword</th>
                  <th className="py-3.5 px-4">Secondary Keywords</th>
                  <th className="py-3.5 px-4 text-center">Word Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPages.map(page => {
                  const meta = page.metadata;
                  const isService = page.category === 'service';
                  const isBlog = page.category === 'blog';

                  return (
                    <tr key={meta.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Title & URL */}
                      <td className="py-4 px-4 max-w-xs space-y-1">
                        <div className="font-bold text-slate-900 truncate" title={meta.title}>
                          {meta.title || meta.h1 || 'Untitled Page'}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] truncate" title={meta.url}>
                          {meta.path || meta.url}
                        </div>

                        {/* Source Badges */}
                        {meta.sourceType === 'sitemap_xml' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold mt-1">
                            <Globe className="w-3 h-3 text-indigo-500" /> Sitemap Link (Slug Parsed)
                          </span>
                        )}
                        {meta.sourceType === 'url_list' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-semibold mt-1">
                            <Globe className="w-3 h-3 text-blue-500" /> URL Slug Parsed
                          </span>
                        )}
                        {meta.isSpaOrEmpty && meta.sourceType !== 'sitemap_xml' && meta.sourceType !== 'url_list' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium mt-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Insufficient Content
                          </span>
                        )}
                      </td>

                      {/* Category Override & "Why" Tooltip */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={page.category}
                            onChange={e => onCategoryOverride(selectedSite, meta.id, e.target.value as PageCategory)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer outline-none ${
                              isService
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : isBlog
                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <option value="service">Service Page</option>
                            <option value="blog">Blog / Article</option>
                            <option value="other">Other / Utility</option>
                          </select>

                          {/* "Why" Classification Tooltip Trigger */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveTooltipId(activeTooltipId === meta.id ? null : meta.id)}
                              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                              title="Click to view classification rationale"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>

                            {activeTooltipId === meta.id && (
                              <div className="absolute left-0 top-full mt-1 z-30 w-64 p-3 bg-slate-900 text-slate-100 text-[11px] rounded-xl shadow-xl border border-slate-700 leading-relaxed space-y-1">
                                <div className="font-bold text-indigo-300">Classification Rationale:</div>
                                <p>{page.classificationReason}</p>
                                {page.isManualOverride && (
                                  <div className="text-amber-400 font-semibold pt-1">
                                    • Manually overridden by user
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Primary Keyword */}
                      <td className="py-4 px-4">
                        {page.primaryKeyword ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs">
                              <Tag className="w-3 h-3 text-indigo-500" />
                              {page.primaryKeyword.term}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              {page.primaryKeyword.isVolumeBacked ? (
                                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  Volume-backed ({page.primaryKeyword.volume?.toLocaleString()} / mo)
                                </span>
                              ) : (
                                <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Frequency-inferred
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No keyword extracted</span>
                        )}
                      </td>

                      {/* Secondary Keywords */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {page.secondaryKeywords.length > 0 ? (
                            page.secondaryKeywords.map((sec, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                              >
                                {sec.term}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </div>
                      </td>

                      {/* Word Count */}
                      <td className="py-4 px-4 text-center font-mono font-medium text-slate-600">
                        {meta.wordCount} words
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CTA to Gap Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h4 className="font-bold text-base text-slate-100">
            Proceed to Competitive Gap Analysis
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Compare competitor service and blog topics against your site to uncover missing revenue opportunities.
          </p>
        </div>
        <button
          onClick={onProceedToGaps}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer whitespace-nowrap"
        >
          View Strategic Gap Opportunities
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
