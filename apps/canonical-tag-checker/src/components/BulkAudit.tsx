import React, { useState, useEffect } from 'react';
import { PageAuditResult, BulkCluster, DuplicateTitleCluster } from '../types';
import { auditPage, analyzeBulkAudit } from '../utils/canonicalAnalyzer';
import { BULK_SAMPLE_PRESET } from '../data/samplePages';
import { exportResultsToCSV } from '../utils/csvExporter';
import {
  Layers,
  Sparkles,
  Download,
  AlertTriangle,
  GitBranch,
  Search,
} from 'lucide-react';

export const BulkAudit: React.FC = () => {
  const [inputMethod] = useState<'delimiter'>('delimiter');
  const [htmlBlocksInput, setHtmlBlocksInput] = useState<string>('');
  const [delimiter, setDelimiter] = useState<string>('---');

  const [pageResults, setPageResults] = useState<PageAuditResult[]>([]);
  const [clusters, setClusters] = useState<BulkCluster[]>([]);
  const [chains, setChains] = useState<Array<{ sourceUrl: string; targetUrl: string; finalTargetUrl: string }>>([]);
  const [duplicateTitles, setDuplicateTitles] = useState<DuplicateTitleCluster[]>([]);

  const [filterErrorsOnly, setFilterErrorsOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auto-run bulk audit on mount with pre-loaded bulk sample
  useEffect(() => {
    loadBulkSample();
  }, []);

  const loadBulkSample = () => {
    const results = BULK_SAMPLE_PRESET.pages.map((p) =>
      auditPage(p.url, p.html, p.headers || '')
    );
    setPageResults(results);
    const bulkAnalysis = analyzeBulkAudit(results);
    setClusters(bulkAnalysis.clusters);
    setChains(bulkAnalysis.chains);
    setDuplicateTitles(bulkAnalysis.duplicateTitles);
  };

  const processBulkHTMLBlocks = () => {
    if (!htmlBlocksInput.trim()) return;
    const blocks = htmlBlocksInput.split(delimiter).filter((b) => b.trim().length > 0);
    const results: PageAuditResult[] = [];

    blocks.forEach((block, idx) => {
      // Try to extract URL from <base href> or first comment or fallback
      let extractedUrl = `https://www.example-site.com/audited-page-${idx + 1}`;
      const baseMatch = block.match(/<base\s+href=["']([^"']+)["']/i);
      if (baseMatch) {
        extractedUrl = baseMatch[1];
      } else {
        const commentUrlMatch = block.match(/<!--\s*url:\s*([^\s]+)\s*-->/i);
        if (commentUrlMatch) {
          extractedUrl = commentUrlMatch[1];
        }
      }

      results.push(auditPage(extractedUrl, block));
    });

    setPageResults(results);
    const bulkAnalysis = analyzeBulkAudit(results);
    setClusters(bulkAnalysis.clusters);
    setChains(bulkAnalysis.chains);
    setDuplicateTitles(bulkAnalysis.duplicateTitles);
  };

  const filteredResults = pageResults.filter((r) => {
    if (filterErrorsOnly && r.stats.fails === 0 && r.stats.warnings === 0) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.pageUrl.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.canonicalTarget && r.canonicalTarget.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white border-4 border-slate-900 p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-slate-900 mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
              Bulk Cross-Page Section Audit
            </h2>
          </div>

          <button
            onClick={loadBulkSample}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider border-b-4 border-indigo-950 active:translate-y-0.5 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Load E-Commerce Section Audit Sample</span>
          </button>
        </div>

        {/* Input Mode Selector */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase">
            <span className="px-3 py-2 bg-slate-900 text-white border-2 border-slate-900">
              Paste HTML Blocks (Separated by delimiter &apos;---&apos;)
            </span>
          </div>

          {inputMethod === 'delimiter' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Delimiter String:
                </label>
                <input
                  type="text"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="w-24 px-2 py-1.5 border-2 border-slate-900 bg-slate-50 text-xs font-mono font-bold text-center"
                />
              </div>

              <textarea
                value={htmlBlocksInput}
                onChange={(e) => setHtmlBlocksInput(e.target.value)}
                rows={6}
                placeholder={`<!-- url: https://shop.com/shoes/red -->\n<html><head><link rel="canonical" href="https://shop.com/shoes/master"></head></html>\n---\n<!-- url: https://shop.com/shoes/blue -->\n<html><head><link rel="canonical" href="https://shop.com/shoes/master"></head></html>`}
                className="w-full p-4 border-2 border-slate-900 bg-slate-950 text-emerald-400 text-xs font-mono font-bold focus:outline-none"
              />

              <button
                onClick={processBulkHTMLBlocks}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider border-b-4 border-slate-950 active:translate-y-0.5 transition-all shadow-xs cursor-pointer"
              >
                Analyze Multi-HTML Blocks
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Results Dashboard */}
      {pageResults.length > 0 && (
        <div className="space-y-6">
          {/* Section 1: Canonical Target Clusters (Grouping Pages claiming to be duplicates) */}
          <div className="bg-white border-4 border-slate-900 p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  <span>Canonical Target Clusters</span>
                  <span className="text-xs px-2.5 py-0.5 border-2 border-slate-900 bg-slate-900 text-white font-mono font-bold">
                    {clusters.length} Clusters
                  </span>
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  Groups pages claiming to be duplicate variants of the same master target.
                </p>
              </div>

              <button
                onClick={() => exportResultsToCSV(pageResults, clusters)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 font-black text-xs uppercase tracking-wider border-b-4 border-slate-950 active:translate-y-0.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Export CSV Report</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clusters.map((cluster, idx) => (
                <div
                  key={idx}
                  className={`p-4 border-2 border-slate-900 ${
                    cluster.isOrphaned
                      ? 'bg-rose-50'
                      : 'bg-slate-50'
                  } shadow-xs`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-black text-slate-600 block">
                        Canonical Target URL
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 truncate block">
                        {cluster.canonicalTarget}
                      </span>
                    </div>

                    {cluster.isOrphaned ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border-2 border-slate-900 bg-rose-600 text-white shrink-0">
                        Orphaned Target
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border-2 border-slate-900 bg-emerald-600 text-white shrink-0">
                        {cluster.pages.length} Pages Cluster
                      </span>
                    )}
                  </div>

                  {cluster.isOrphaned && (
                    <div className="p-2.5 border-2 border-slate-900 bg-rose-100 text-slate-950 text-xs mb-3 font-semibold leading-relaxed">
                      <strong className="font-black uppercase">CRITICAL ORPHAN WARNING:</strong> Declared master target URL was never included or verified in this audit batch!
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Claiming Pages in Batch:
                    </span>
                    {cluster.pages.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-2 border border-slate-900 bg-white text-xs font-mono font-bold text-slate-900 truncate"
                      >
                        • {p.url}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Canonical Chains Warning */}
          {chains.length > 0 && (
            <div className="p-5 border-4 border-slate-900 bg-amber-50 text-slate-900 space-y-3 shadow-md">
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wide text-slate-900">
                <GitBranch className="w-5 h-5 text-amber-700 stroke-[2.5]" />
                <span>Canonical Chain(s) Detected in Batch ({chains.length})</span>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-slate-800">
                Page A points canonical to Page B, but Page B canonicalizes to Page C. Search engines may stop resolving canonical signals across chains.
              </p>
              <div className="space-y-2 pt-1">
                {chains.map((chain, cIdx) => (
                  <div key={cIdx} className="p-3 border-2 border-slate-900 bg-white text-xs font-mono font-bold">
                    <span className="text-slate-800">{chain.sourceUrl}</span>
                    <span className="text-amber-700 font-black px-1.5 font-sans">➔</span>
                    <span className="text-amber-800">{chain.targetUrl}</span>
                    <span className="text-amber-700 font-black px-1.5 font-sans">➔</span>
                    <span className="text-emerald-700 font-black">{chain.finalTargetUrl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Duplicate Title / H1 Analysis (Missing Canonicals) */}
          {duplicateTitles.length > 0 && (
            <div className="bg-white border-4 border-slate-900 p-5 sm:p-6 shadow-md space-y-3">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                <span>Duplicate Title Tags across Unlinked Canonicals</span>
              </h3>
              <p className="text-xs font-semibold text-slate-600">
                Pages sharing identical/near-identical Titles but lacking a unified canonical target — potential missing canonicalization opportunity.
              </p>

              <div className="space-y-2.5">
                {duplicateTitles.map((dt, dtIdx) => (
                  <div key={dtIdx} className="p-3.5 border-2 border-slate-900 bg-slate-50 text-xs space-y-1">
                    <div className="font-black text-slate-900 uppercase tracking-tight">
                      Title: &quot;{dt.text}&quot;
                    </div>
                    <div className="text-slate-700 space-y-1 font-mono font-bold">
                      {dt.pages.map((p, pIdx) => (
                        <div key={pIdx} className="text-[11px] truncate">
                          • {p.url} (Canonical Target: {p.canonicalTarget || 'None'})
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Bulk Pages Audit Matrix Table */}
          <div className="bg-white border-4 border-slate-900 p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                All Audited Pages Matrix ({filteredResults.length} / {pageResults.length})
              </h3>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search query input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 stroke-[2.5]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search URL or title..."
                    className="pl-9 pr-3 py-1.5 border-2 border-slate-900 bg-slate-50 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                {/* Filter errors only toggle */}
                <label className="flex items-center gap-1.5 text-xs text-slate-900 font-black uppercase cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterErrorsOnly}
                    onChange={(e) => setFilterErrorsOnly(e.target.checked)}
                    className="w-4 h-4 border-2 border-slate-900 bg-slate-50 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Show Errors & Warnings Only</span>
                </label>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border-2 border-slate-900 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-900 text-white font-black uppercase tracking-wider">
                    <th className="py-3.5 px-4">Page URL</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Canonical Target</th>
                    <th className="py-3.5 px-4">Self-Ref?</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono font-bold">
                  {filteredResults.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-100 transition-colors">
                      <td className="py-3 px-4 max-w-xs truncate text-slate-900" title={res.pageUrl}>
                        {res.pageUrl}
                      </td>
                      <td className="py-3 px-4 font-bold font-sans">
                        <span
                          className={`px-2.5 py-0.5 border-2 border-slate-900 text-white text-[11px] font-black ${
                            res.score >= 80 ? 'bg-emerald-600' : res.score >= 50 ? 'bg-amber-500 text-slate-950' : 'bg-rose-600'
                          }`}
                        >
                          {res.score}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-800" title={res.canonicalTarget || 'None'}>
                        {res.canonicalTarget || 'None'}
                      </td>
                      <td className="py-3 px-4 font-sans font-black">
                        {res.isSelfCanonical ? (
                          <span className="text-emerald-700">YES</span>
                        ) : (
                          <span className="text-amber-700">NO</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-1.5">
                          {res.stats.fails > 0 && (
                            <span className="px-2 py-0.5 border-2 border-slate-900 bg-rose-600 text-white text-[10px] font-black uppercase">
                              {res.stats.fails} Error(s)
                            </span>
                          )}
                          {res.stats.warnings > 0 && (
                            <span className="px-2 py-0.5 border-2 border-slate-900 bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                              {res.stats.warnings} Warning(s)
                            </span>
                          )}
                          {res.stats.fails === 0 && res.stats.warnings === 0 && (
                            <span className="px-2 py-0.5 border-2 border-slate-900 bg-emerald-600 text-white text-[10px] font-black uppercase">
                              All Clear
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

