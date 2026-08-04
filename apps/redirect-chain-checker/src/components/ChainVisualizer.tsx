import React, { useState } from 'react';
import { Hop, ChainAnalysis } from '../types';
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Lock, 
  Unlock, 
  Clock, 
  Info, 
  ExternalLink,
  Trash2,
  Copy,
  Check
} from 'lucide-react';

interface ChainVisualizerProps {
  analysis: ChainAnalysis;
  onSelectHop?: (hop: Hop) => void;
  onDeleteHop?: (hopId: string) => void;
  onAddHopAfter?: (hopIndex: number) => void;
  isEditable?: boolean;
}

export const ChainVisualizer: React.FC<ChainVisualizerProps> = ({
  analysis,
  onSelectHop,
  onDeleteHop,
  isEditable = false,
}) => {
  const [activeHopId, setActiveHopId] = useState<string | null>(
    analysis.hops.length > 0 ? analysis.hops[0].id : null
  );
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const selectedHop = analysis.hops.find(h => h.id === activeHopId) || analysis.hops[0];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getStatusBadgeStyle = (code?: number, isOpaque?: boolean) => {
    if (isOpaque) {
      return 'bg-amber-100 text-amber-900 border-amber-400';
    }
    if (!code) {
      return 'bg-slate-100 text-slate-800 border-slate-400';
    }
    if (code >= 200 && code < 300) {
      return 'bg-emerald-100 text-emerald-900 border-emerald-400';
    }
    if (code === 301 || code === 308) {
      return 'bg-blue-100 text-blue-900 border-blue-400';
    }
    if (code === 302 || code === 303 || code === 307) {
      return 'bg-amber-100 text-amber-900 border-amber-400';
    }
    if (code >= 400) {
      return 'bg-red-100 text-red-900 border-red-400';
    }
    return 'bg-slate-100 text-slate-800 border-slate-400';
  };

  return (
    <div className="bg-white border border-[#141414] p-5 tech-shadow text-[#141414]">
      {/* Top Header Summary Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 mb-6 border-b border-[#141414]">
        <div>
          <span className="col-header block">CHAIN MAPPER</span>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[#141414] uppercase tracking-tight">{analysis.title}</h2>
            <span className="mono text-xs px-2 py-0.5 font-bold bg-[#141414] text-white uppercase">
              {analysis.mode} MODE
            </span>
          </div>
          <p className="mono text-xs text-[#141414] opacity-70 mt-1">
            {analysis.totalHops} HOPS ({analysis.totalRedirects} REDIRECTS)
            {analysis.totalTimeMs ? ` • LATENCY: ${analysis.totalTimeMs}MS` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 font-bold mono text-xs uppercase">
          {analysis.hasDowngrade && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-900 border border-red-400">
              <Unlock className="w-3.5 h-3.5" />
              HTTPS DOWNGRADE
            </span>
          )}
          {analysis.hasLoop && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-900 border border-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              REDIRECT LOOP
            </span>
          )}
          {analysis.endsInError && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-900 border border-red-400">
              <XCircle className="w-3.5 h-3.5" />
              BROKEN TARGET
            </span>
          )}
          {!analysis.hasDowngrade && !analysis.hasLoop && !analysis.endsInError && analysis.totalRedirects <= 1 && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              CLEAN CHAIN
            </span>
          )}
        </div>
      </div>

      {/* HORIZONTAL FLOW DIAGRAM */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="col-header">VISUAL HOP SEQUENCE MAP</span>
          <span className="mono text-[11px] opacity-60">
            [CLICK HOP TO INSPECT HEADERS]
          </span>
        </div>

        <div className="overflow-x-auto pb-4 pt-1 custom-scrollbar">
          <div className="flex items-center min-w-max gap-3 px-1">
            {analysis.hops.map((hop, index) => {
              const isLast = index === analysis.hops.length - 1;
              const isSelected = activeHopId === hop.id;
              const isHttps = hop.url.toLowerCase().startsWith('https://');
              
              const nextHop = analysis.hops[index + 1];
              const isDowngradeNext = nextHop && isHttps && !nextHop.url.toLowerCase().startsWith('https://');

              return (
                <React.Fragment key={hop.id}>
                  {/* HOP CARD NODE */}
                  <div
                    onClick={() => {
                      setActiveHopId(hop.id);
                      if (onSelectHop) onSelectHop(hop);
                    }}
                    className={`relative cursor-pointer transition-all p-3.5 w-64 border border-[#141414] ${
                      isSelected
                        ? 'bg-[#141414] text-white tech-shadow'
                        : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                    }`}
                  >
                    {/* Header line: Step # & Protocol badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-5 h-5 font-bold mono text-[10px] flex items-center justify-center border ${
                          isSelected ? 'bg-white text-black border-white' : 'bg-[#141414] text-white border-[#141414]'
                        }`}>
                          {hop.stepNumber}
                        </span>
                        <span className="mono text-xs font-bold uppercase">
                          {isLast ? 'TARGET' : `HOP #${hop.stepNumber}`}
                        </span>
                      </div>

                      <div>
                        {isHttps ? (
                          <span className={`mono text-[10px] px-1.5 py-0.5 font-bold uppercase flex items-center gap-1 border ${
                            isSelected ? 'border-emerald-400 text-emerald-300' : 'border-emerald-600 text-emerald-800 bg-emerald-50'
                          }`}>
                            <Lock className="w-2.5 h-2.5" />
                            HTTPS
                          </span>
                        ) : (
                          <span className={`mono text-[10px] px-1.5 py-0.5 font-bold uppercase flex items-center gap-1 border ${
                            isSelected ? 'border-amber-400 text-amber-300' : 'border-amber-600 text-amber-800 bg-amber-50'
                          }`}>
                            <Unlock className="w-2.5 h-2.5" />
                            HTTP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Code Badge */}
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold mono border uppercase ${getStatusBadgeStyle(hop.statusCode, hop.isOpaque)}`}>
                        {hop.isOpaque ? '3xx OPAQUE' : hop.statusCode ? `${hop.statusCode} ${hop.redirectType || ''}` : 'UNKNOWN STATUS'}
                      </span>
                    </div>

                    {/* URL String */}
                    <div className="text-xs font-mono truncate title-tooltip font-medium" title={hop.url}>
                      {hop.url}
                    </div>

                    {/* Latency / Note */}
                    <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] font-mono ${
                      isSelected ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-[#141414]'
                    }`}>
                      {hop.responseTimeMs ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hop.responseTimeMs} ms
                        </span>
                      ) : (
                        <span className="opacity-50">NO TIMING</span>
                      )}

                      {hop.headers && Object.keys(hop.headers).length > 0 && (
                        <span className="font-bold text-[#F27D26]">
                          {Object.keys(hop.headers).length} HEADERS
                        </span>
                      )}
                    </div>

                    {/* Delete Hop button if editable */}
                    {isEditable && analysis.hops.length > 1 && onDeleteHop && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHop(hop.id);
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-600 hover:bg-red-700 text-white border border-[#141414]"
                        title="Delete Hop"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* CONNECTING ARROW BETWEEN HOPS */}
                  {!isLast && (
                    <div className="flex flex-col items-center justify-center px-1">
                      <div className="flex items-center gap-1">
                        <div className={`h-[2px] w-6 ${isDowngradeNext ? 'bg-red-600' : 'bg-[#141414]'}`} />
                        <div className={`p-1.5 border border-[#141414] ${
                          isDowngradeNext 
                            ? 'bg-red-600 text-white' 
                            : 'bg-[#141414] text-white'
                        }`}>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        <div className={`h-[2px] w-6 ${isDowngradeNext ? 'bg-red-600' : 'bg-[#141414]'}`} />
                      </div>
                      <span className={`text-[10px] font-mono mt-1 font-bold ${
                        isDowngradeNext ? 'text-red-600' : 'text-[#141414]'
                      }`}>
                        {hop.statusCode ? `HTTP ${hop.statusCode}` : 'REDIRECT'}
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* SELECTED HOP DETAILS INSPECTOR */}
      {selectedHop && (
        <div className="bg-[#141414] text-white p-4 border border-[#141414]">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-white text-black font-bold text-xs mono flex items-center justify-center">
                {selectedHop.stepNumber}
              </span>
              <div>
                <h4 className="text-sm font-bold uppercase mono text-white flex items-center gap-2">
                  <span>HOP DETAILED LOG: {selectedHop.url}</span>
                  <a
                    href={selectedHop.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-[#F27D26] transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </h4>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(selectedHop.url)}
              className="flex items-center gap-1 text-xs font-mono uppercase px-2.5 py-1 bg-slate-900 border border-slate-700 hover:border-white text-slate-200 transition-colors"
            >
              {copiedUrl === selectedHop.url ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY URL</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 uppercase font-bold block mb-1">HOP METRICS</span>
              <div className="bg-slate-950 p-3 border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">HTTP STATUS:</span>
                  <span className="font-bold text-white">
                    {selectedHop.statusCode ? `${selectedHop.statusCode} ${selectedHop.statusText || ''}` : 'OPAQUE / UNKNOWN'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">REDIRECT TYPE:</span>
                  <span className="text-[#F27D26] font-bold">{selectedHop.redirectType || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PROTOCOL:</span>
                  <span className={selectedHop.url.startsWith('https') ? 'text-emerald-400' : 'text-amber-400'}>
                    {selectedHop.url.startsWith('https') ? 'HTTPS (ENCRYPTED)' : 'HTTP (PLAIN TEXT)'}
                  </span>
                </div>
              </div>

              {selectedHop.note && (
                <div className="mt-3 bg-slate-950 border border-slate-800 p-2.5 text-slate-300">
                  <div className="font-bold text-[11px] mb-0.5 text-[#F27D26] uppercase flex items-center gap-1">
                    <Info className="w-3 h-3" /> CONTEXT NOTE
                  </div>
                  <p className="text-[11px] leading-relaxed">{selectedHop.note}</p>
                </div>
              )}
            </div>

            <div>
              <span className="text-slate-400 uppercase font-bold block mb-1">HTTP RESPONSE HEADERS</span>
              {selectedHop.headers && Object.keys(selectedHop.headers).length > 0 ? (
                <div className="bg-slate-950 p-3 border border-slate-800 text-[11px] max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                  {Object.entries(selectedHop.headers).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-[#F27D26] font-bold shrink-0">{k}:</span>
                      <span className="text-slate-300 break-all">{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950 p-3 border border-slate-800 text-slate-500 italic text-[11px]">
                  NO CAPTURED HEADERS FOR THIS HOP.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

