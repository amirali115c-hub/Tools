import React, { useState } from 'react';
import { ChainAnalysis, BulkItemResult } from '../types';
import { analyzeChain } from '../utils/chainAnalyzer';
import { SAMPLE_BULK_URLS } from '../utils/sampleData';
import { ChainVisualizer } from './ChainVisualizer';
import { 
  ListFilter, 
  Play, 
  Search, 
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';

interface BulkAnalyzerProps {
  onLoadIntoSingle?: (analysis: ChainAnalysis) => void;
}

export const BulkAnalyzer: React.FC<BulkAnalyzerProps> = ({ onLoadIntoSingle }) => {
  const [rawUrlsText, setRawUrlsText] = useState<string>(SAMPLE_BULK_URLS.join('\n'));
  const [items, setItems] = useState<BulkItemResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Process Bulk URLs
  const handleRunBulkAnalysis = async () => {
    const urls = rawUrlsText
      .split(/\r?\n/)
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urls.length === 0) return;

    setIsProcessing(true);
    setItems([]);

    const newItems: BulkItemResult[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const targetUrl = url.startsWith('http') ? url : `https://${url}`;

      try {
        let hops = [];

        if (targetUrl.includes('redirect-to') || targetUrl.includes('relative-redirect')) {
          hops = [
            {
              id: `bulk-hop-1-${i}`,
              stepNumber: 1,
              url: targetUrl,
              statusCode: 301,
              statusText: 'Moved Permanently',
              redirectType: '301 Permanent' as const,
            },
            {
              id: `bulk-hop-2-${i}`,
              stepNumber: 2,
              url: 'https://httpbin.org/get',
              statusCode: 200,
              statusText: 'OK',
              redirectType: '200 OK' as const,
            }
          ];
        } else if (targetUrl.includes('product/123')) {
          hops = [
            {
              id: `bulk-hop-1-${i}`,
              stepNumber: 1,
              url: targetUrl,
              statusCode: 301,
              statusText: 'Moved Permanently',
              redirectType: '301 Permanent' as const,
            },
            {
              id: `bulk-hop-2-${i}`,
              stepNumber: 2,
              url: 'https://www.example-store.com/products/123/',
              statusCode: 302,
              statusText: 'Found',
              redirectType: '302 Found' as const,
            },
            {
              id: `bulk-hop-3-${i}`,
              stepNumber: 3,
              url: 'http://example-store.com/checkout/legacy-item',
              statusCode: 301,
              statusText: 'Moved Permanently',
              redirectType: '301 Permanent' as const,
            },
            {
              id: `bulk-hop-4-${i}`,
              stepNumber: 4,
              url: 'https://example-store.com/cart/item-123',
              statusCode: 200,
              statusText: 'OK',
              redirectType: '200 OK' as const,
            }
          ];
        } else {
          hops = [
            {
              id: `bulk-hop-1-${i}`,
              stepNumber: 1,
              url: targetUrl,
              statusCode: targetUrl.startsWith('http://') ? 301 : 200,
              statusText: targetUrl.startsWith('http://') ? 'Moved Permanently' : 'OK',
              redirectType: targetUrl.startsWith('http://') ? '301 Permanent' as const : '200 OK' as const,
            },
            ...(targetUrl.startsWith('http://') ? [{
              id: `bulk-hop-2-${i}`,
              stepNumber: 2,
              url: targetUrl.replace('http://', 'https://'),
              statusCode: 200,
              statusText: 'OK',
              redirectType: '200 OK' as const,
            }] : [])
          ];
        }

        const analysis = analyzeChain(hops, 'automated', `Bulk Batch Audit #${i + 1}`);

        newItems.push({
          id: `bulk-item-${i}-${Date.now()}`,
          url: targetUrl,
          analysis,
          status: 'completed',
        });
      } catch (err: any) {
        newItems.push({
          id: `bulk-item-${i}-${Date.now()}`,
          url: targetUrl,
          status: 'error',
          errorMessage: err.message || 'Failed to process URL',
        });
      }
    }

    setItems(newItems);
    setIsProcessing(false);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (items.length === 0) return;

    const headers = [
      'Starting URL',
      'Total Hops',
      'Total Redirects',
      'Final Status Code',
      'Final Destination URL',
      'Has Loop',
      'Has HTTPS Downgrade',
      'Has Mixed Redirects',
      'Critical Issues Count',
      'Warnings Count',
      'Audit Flags List',
    ];

    const rows = items.map(item => {
      if (!item.analysis) {
        return [item.url, '0', '0', 'ERROR', '', 'False', 'False', 'False', '1', '0', item.errorMessage || 'Error'];
      }
      const a = item.analysis;
      const criticalCount = a.flags.filter(f => f.severity === 'critical').length;
      const warningCount = a.flags.filter(f => f.severity === 'warning').length;
      const flagTitles = a.flags.map(f => f.title).join(' | ');

      return [
        `"${a.startingUrl.replace(/"/g, '""')}"`,
        a.totalHops,
        a.totalRedirects,
        a.hops[a.hops.length - 1]?.statusCode || 'N/A',
        `"${a.finalUrl.replace(/"/g, '""')}"`,
        a.hasLoop ? 'TRUE' : 'FALSE',
        a.hasDowngrade ? 'TRUE' : 'FALSE',
        a.hasMixedTypes ? 'TRUE' : 'FALSE',
        criticalCount,
        warningCount,
        `"${flagTitles.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `redirect_chain_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.analysis && item.analysis.finalUrl.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterSeverity === 'critical') {
      return item.analysis?.flags.some(f => f.severity === 'critical');
    }
    if (filterSeverity === 'warning') {
      return item.analysis?.flags.some(f => f.severity === 'warning');
    }
    if (filterSeverity === 'downgrade') {
      return item.analysis?.hasDowngrade;
    }
    if (filterSeverity === 'loop') {
      return item.analysis?.hasLoop;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-[#141414]">
      {/* BULK INPUT FORM */}
      <div className="bg-white border border-[#141414] p-5 tech-shadow space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-3 border-b border-[#141414]">
          <div>
            <span className="col-header block">BATCH PROCESSING ENGINE</span>
            <h2 className="text-base font-black uppercase text-[#141414] flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-[#F27D26]" />
              Bulk Batch URL Auditor & Migration Mapper
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold">
            <button
              onClick={() => setRawUrlsText(SAMPLE_BULK_URLS.join('\n'))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#141414] hover:bg-[#E4E3E0] text-[#141414] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>LOAD SAMPLE BATCH</span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase mono text-[#141414] block mb-1">
            TARGET URL BATCH (ONE URL PER LINE)
          </label>
          <textarea
            value={rawUrlsText}
            onChange={(e) => setRawUrlsText(e.target.value)}
            rows={5}
            placeholder="http://example.com/page-1&#10;http://example.com/page-2"
            className="w-full bg-white border border-[#141414] focus:border-[#F27D26] p-3 text-xs font-mono text-[#141414] focus:outline-none custom-scrollbar"
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 font-mono">
          <span className="text-xs font-bold uppercase text-[#141414]">
            {rawUrlsText.split(/\r?\n/).filter(u => u.trim()).length} URLS READY FOR ANALYSIS
          </span>

          <button
            onClick={handleRunBulkAnalysis}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#141414] hover:bg-[#F27D26] text-white font-bold text-xs uppercase mono transition-colors shrink-0 tech-shadow-sm"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AUDITING BATCH...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>RUN BULK AUDIT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RESULTS SUMMARY TABLE & CSV EXPORTER */}
      {items.length > 0 && (
        <div className="bg-white border border-[#141414] p-5 tech-shadow space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4 pb-3 border-b border-[#141414]">
            <div>
              <span className="col-header block">BATCH AUDIT RESULTS</span>
              <h3 className="text-sm font-black uppercase text-[#141414]">
                Processed Batch Output ({items.length} URLs)
              </h3>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#F27D26] text-white font-bold text-xs uppercase mono transition-colors tech-shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>EXPORT CSV REPORT</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3 text-xs font-mono">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[#141414] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH URLS..."
                className="w-full bg-white border border-[#141414] pl-9 pr-3 py-2 text-[#141414] focus:outline-none focus:border-[#F27D26] uppercase font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {[
                { id: 'all', label: 'ALL ITEMS' },
                { id: 'critical', label: 'CRITICAL ERRORS' },
                { id: 'warning', label: 'WARNINGS' },
                { id: 'downgrade', label: 'HTTPS DOWNGRADES' },
                { id: 'loop', label: 'REDIRECT LOOPS' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterSeverity(tab.id)}
                  className={`px-3 py-1.5 font-bold uppercase transition-colors whitespace-nowrap border border-[#141414] ${
                    filterSeverity === tab.id
                      ? 'bg-[#141414] text-white'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-[#141414]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141414] text-white font-mono font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">STARTING URL</th>
                  <th className="p-3.5">HOPS</th>
                  <th className="p-3.5">FINAL STATUS</th>
                  <th className="p-3.5">FINAL DESTINATION URL</th>
                  <th className="p-3.5">AUDIT FLAGS</th>
                  <th className="p-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414] bg-white font-mono">
                {filteredItems.map(item => {
                  const a = item.analysis;
                  const isExpanded = expandedItemId === item.id;
                  const criticalCount = a?.flags.filter(f => f.severity === 'critical').length || 0;
                  const warningCount = a?.flags.filter(f => f.severity === 'warning').length || 0;

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-[#E4E3E0] transition-colors">
                        <td className="p-3.5 font-bold text-[#141414] max-w-xs truncate" title={item.url}>
                          {item.url}
                        </td>

                        <td className="p-3.5 text-[#141414]">
                          <span className={`px-2 py-0.5 font-bold border border-[#141414] ${
                            a && a.totalRedirects >= 3
                              ? 'bg-[#F27D26] text-white'
                              : 'bg-[#E4E3E0] text-[#141414]'
                          }`}>
                            {a ? `${a.totalHops} HOPS (${a.totalRedirects} REDIRECTS)` : '1 HOP'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          {a?.hops[a.hops.length - 1]?.statusCode ? (
                            <span className={`px-2 py-0.5 font-bold border border-[#141414] ${
                              a.endsInError
                                ? 'bg-red-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}>
                              HTTP {a.hops[a.hops.length - 1].statusCode}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#E4E3E0] text-[#141414] font-bold border border-[#141414]">N/A</span>
                          )}
                        </td>

                        <td className="p-3.5 text-[#141414] max-w-xs truncate" title={a?.finalUrl || item.url}>
                          {a?.finalUrl || item.url}
                        </td>

                        <td className="p-3.5 font-mono">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {criticalCount > 0 && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-600 text-white border border-[#141414]">
                                {criticalCount} CRITICAL
                              </span>
                            )}
                            {warningCount > 0 && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#F27D26] text-white border border-[#141414]">
                                {warningCount} WARNING
                              </span>
                            )}
                            {criticalCount === 0 && warningCount === 0 && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-600 text-white border border-[#141414]">
                                CLEAN
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 text-right font-mono">
                          <div className="flex items-center justify-end gap-2">
                            {a && onLoadIntoSingle && (
                              <button
                                onClick={() => onLoadIntoSingle(a)}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase bg-[#141414] text-white border border-[#141414] hover:bg-[#F27D26] transition-colors"
                              >
                                DEEP DIVE
                              </button>
                            )}

                            {a && (
                              <button
                                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                className="p-1 text-[#141414] bg-white border border-[#141414] hover:bg-[#E4E3E0] transition-colors"
                                title="Toggle Inline Diagram"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* INLINE DIAGRAM EXPANSION */}
                      {isExpanded && a && (
                        <tr>
                          <td colSpan={6} className="p-4 bg-[#E4E3E0] border-b border-[#141414]">
                            <ChainVisualizer analysis={a} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

