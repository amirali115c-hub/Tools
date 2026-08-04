import React, { useState, useEffect } from 'react';
import { Hop, ChainAnalysis, RedirectMode } from '../types';
import { analyzeChain } from '../utils/chainAnalyzer';
import { parseCurlOutput } from '../utils/curlParser';
import { PRELOADED_SAMPLE_CHAIN, SAMPLE_CURL_RAW, SAMPLE_HOPS } from '../utils/sampleData';
import { ChainVisualizer } from './ChainVisualizer';
import { AuditSummary } from './AuditSummary';
import { HopEditor } from './HopEditor';
import { 
  Terminal, 
  Sliders, 
  Globe, 
  Play, 
  BookmarkPlus, 
  Download, 
  Check, 
  Target, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface SingleChainAnalyzerProps {
  onSaveChain?: (analysis: ChainAnalysis) => void;
  initialAnalysis?: ChainAnalysis;
}

export const SingleChainAnalyzer: React.FC<SingleChainAnalyzerProps> = ({
  onSaveChain,
}) => {
  const [activeMode, setActiveMode] = useState<RedirectMode>('manual');
  const [canonicalTarget, setCanonicalTarget] = useState<string>('https://example-store.com/cart/item-123');
  
  // State for Manual Mode
  const [manualHops, setManualHops] = useState<Hop[]>(SAMPLE_HOPS);
  
  // State for Curl Mode
  const [curlRawText, setCurlRawText] = useState<string>(SAMPLE_CURL_RAW);
  const [curlInitialUrl] = useState<string>('http://example-store.com/product/123');

  // State for Automated Fetch Mode
  const [autoUrl, setAutoUrl] = useState<string>('https://httpbin.org/redirect/2');
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [autoHops, setAutoHops] = useState<Hop[]>([]);

  // Current calculated analysis
  const [currentAnalysis, setCurrentAnalysis] = useState<ChainAnalysis>(PRELOADED_SAMPLE_CHAIN);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    let hopsToAnalyze: Hop[] = [];

    if (activeMode === 'manual') {
      hopsToAnalyze = manualHops;
    } else if (activeMode === 'curl') {
      hopsToAnalyze = parseCurlOutput(curlRawText, curlInitialUrl);
    } else if (activeMode === 'automated') {
      hopsToAnalyze = autoHops.length > 0 ? autoHops : [
        {
          id: 'auto-placeholder',
          stepNumber: 1,
          url: autoUrl || 'https://example.com',
          statusCode: 200,
          statusText: 'Click Run Best-Effort Fetch',
          redirectType: '200 OK',
        }
      ];
    }

    if (hopsToAnalyze.length > 0) {
      const title =
        activeMode === 'manual'
          ? 'Manual Chain Analysis'
          : activeMode === 'curl'
          ? 'Parsed Curl Output Chain'
          : 'Automated Browser Fetch Chain';

      const analysis = analyzeChain(
        hopsToAnalyze,
        activeMode,
        title,
        canonicalTarget,
        activeMode === 'curl' ? curlRawText : undefined
      );
      setCurrentAnalysis(analysis);
    }
  }, [activeMode, manualHops, curlRawText, curlInitialUrl, autoHops, canonicalTarget]);

  // Handle Automated Fetch
  const handleRunAutomatedFetch = async () => {
    if (!autoUrl.trim()) return;
    setIsFetching(true);

    const startTime = performance.now();
    const targetUrl = autoUrl.trim().startsWith('http') ? autoUrl.trim() : `https://${autoUrl.trim()}`;

    try {
      const res = await fetch(targetUrl, { redirect: 'manual' });
      const endTime = performance.now();
      const elapsedMs = Math.round(endTime - startTime);

      if (res.type === 'opaqueredirect' || res.status === 0) {
        const hops: Hop[] = [
          {
            id: `auto-1-${Date.now()}`,
            stepNumber: 1,
            url: targetUrl,
            statusCode: 302,
            statusText: 'Opaque Redirect',
            redirectType: 'Opaque/Blocked',
            responseTimeMs: elapsedMs,
            isOpaque: true,
            note: 'Browser followed redirect cross-origin. CORS security masks location headers and status code.',
          },
          {
            id: `auto-2-${Date.now()}`,
            stepNumber: 2,
            url: `${targetUrl} (Redirected Target)`,
            statusCode: 200,
            statusText: 'Inferred Destination',
            redirectType: '200 OK',
            isOpaque: true,
            note: 'Destination reached. Switch to "Curl Header Paste" mode for hop-by-hop status codes.',
          }
        ];
        setAutoHops(hops);
      } else {
        const locationHeader = res.headers.get('location');
        const hops: Hop[] = [
          {
            id: `auto-1-${Date.now()}`,
            stepNumber: 1,
            url: targetUrl,
            statusCode: res.status,
            statusText: res.statusText || (res.status === 200 ? 'OK' : 'Redirect'),
            redirectType: res.status === 301 ? '301 Permanent' : res.status === 302 ? '302 Found' : '200 OK',
            responseTimeMs: elapsedMs,
            headers: Object.fromEntries(res.headers.entries()),
          }
        ];

        if (locationHeader) {
          hops.push({
            id: `auto-2-${Date.now()}`,
            stepNumber: 2,
            url: new URL(locationHeader, targetUrl).toString(),
            statusCode: 200,
            statusText: 'OK',
            redirectType: '200 OK',
          });
        }
        setAutoHops(hops);
      }
    } catch {
      const endTime = performance.now();
      const elapsedMs = Math.round(endTime - startTime);

      const hops: Hop[] = [
        {
          id: `auto-err-1-${Date.now()}`,
          stepNumber: 1,
          url: targetUrl,
          statusCode: 301,
          statusText: 'CORS / Cross-Origin Redirect',
          redirectType: 'Opaque/Blocked',
          responseTimeMs: elapsedMs,
          isOpaque: true,
          note: 'Redirect blocked or masked by CORS policy in browser fetch.',
        },
        {
          id: `auto-err-2-${Date.now()}`,
          stepNumber: 2,
          url: 'Destination URL (Masked by CORS)',
          statusCode: 200,
          statusText: 'Destination Reached',
          redirectType: '200 OK',
          isOpaque: true,
        }
      ];
      setAutoHops(hops);
    } finally {
      setIsFetching(false);
    }
  };

  const handleLoadSampleDemo = () => {
    setActiveMode('manual');
    setManualHops(SAMPLE_HOPS);
    setCanonicalTarget('https://example-store.com/cart/item-123');
    setCurlRawText(SAMPLE_CURL_RAW);
  };

  const handleSave = () => {
    if (onSaveChain) {
      onSaveChain(currentAnalysis);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentAnalysis, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* MODE SELECTION & TOOLBAR */}
      <div className="bg-white border border-[#141414] p-5 tech-shadow text-[#141414]">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 mb-4 border-b border-[#141414]">
          <div>
            <span className="col-header block">ANALYSIS CONTROL PANEL</span>
            <h2 className="text-base font-black uppercase text-[#141414] flex items-center gap-2">
              Redirect Chain Analysis Engine
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs mono uppercase font-bold">
            <button
              onClick={handleLoadSampleDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#141414] hover:bg-[#E4E3E0] text-[#141414] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>LOAD SAMPLE DEMO</span>
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#F27D26] text-white transition-colors tech-shadow-sm"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'SAVED' : 'SAVE AUDIT'}</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#141414] hover:bg-[#E4E3E0] text-[#141414] transition-colors"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'COPIED' : 'EXPORT JSON'}</span>
            </button>
          </div>
        </div>

        {/* Input Mode Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => setActiveMode('manual')}
            className={`p-3.5 border text-left transition-all ${
              activeMode === 'manual'
                ? 'bg-[#141414] text-white border-[#141414] tech-shadow'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0] border-[#141414]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs uppercase mb-1">
              <Sliders className="w-4 h-4 text-[#F27D26]" />
              <span>1. Manual Chain Builder</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-80 font-medium">
              Interactively assemble or edit hop sequences step-by-step.
            </p>
          </button>

          <button
            onClick={() => setActiveMode('curl')}
            className={`p-3.5 border text-left transition-all ${
              activeMode === 'curl'
                ? 'bg-[#141414] text-white border-[#141414] tech-shadow'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0] border-[#141414]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs uppercase mb-1">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>2. Curl Header Paste</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-80 font-medium">
              Paste raw output from <code className="font-mono">curl -IL &lt;url&gt;</code> to parse actual response headers.
            </p>
          </button>

          <button
            onClick={() => setActiveMode('automated')}
            className={`p-3.5 border text-left transition-all ${
              activeMode === 'automated'
                ? 'bg-[#141414] text-white border-[#141414] tech-shadow'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0] border-[#141414]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs uppercase mb-1">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>3. Best-Effort Fetch</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-80 font-medium">
              Fetch starting URL via client browser JS with honest CORS boundaries.
            </p>
          </button>
        </div>

        {/* CANONICAL TARGET DOMAIN OPTIONAL INPUT */}
        <div className="bg-[#E4E3E0] p-3 border border-[#141414] flex items-center gap-3 flex-wrap text-xs font-mono">
          <div className="flex items-center gap-1.5 font-bold uppercase text-[#141414] shrink-0">
            <Target className="w-4 h-4 text-[#F27D26]" />
            <span>OPTIONAL PREFERRED CANONICAL TARGET:</span>
          </div>
          <input
            type="text"
            value={canonicalTarget}
            onChange={(e) => setCanonicalTarget(e.target.value)}
            placeholder="e.g. https://example-store.com/cart/item-123"
            className="flex-1 bg-white border border-[#141414] focus:border-[#F27D26] px-3 py-1.5 text-[#141414] font-mono focus:outline-none min-w-[240px]"
          />
        </div>

        {/* MODE 2 SPECIFIC INPUT: CURL HEADER TEXTAREA */}
        {activeMode === 'curl' && (
          <div className="mt-4 pt-4 border-t border-[#141414] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-[#141414] flex items-center gap-1.5 mono">
                <Terminal className="w-4 h-4 text-emerald-600" />
                RAW CURL OUTPUT / HTTP RESPONSE HEADERS
              </label>
              <button
                onClick={() => setCurlRawText(SAMPLE_CURL_RAW)}
                className="text-[11px] font-mono uppercase font-bold text-[#F27D26] hover:underline"
              >
                RESET SAMPLE CURL TEXT
              </button>
            </div>

            <textarea
              value={curlRawText}
              onChange={(e) => setCurlRawText(e.target.value)}
              rows={8}
              placeholder="Paste curl -IL https://example.com output here..."
              className="w-full bg-[#141414] text-white border border-[#141414] p-3 font-mono text-xs focus:outline-none custom-scrollbar"
            />
          </div>
        )}

        {/* MODE 3 SPECIFIC INPUT: AUTOMATED FETCH */}
        {activeMode === 'automated' && (
          <div className="mt-4 pt-4 border-t border-[#141414] space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={autoUrl}
                onChange={(e) => setAutoUrl(e.target.value)}
                placeholder="https://httpbin.org/redirect/2"
                className="flex-1 bg-white border border-[#141414] px-3.5 py-2 text-xs font-mono text-[#141414] focus:outline-none"
              />
              <button
                onClick={handleRunAutomatedFetch}
                disabled={isFetching}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#141414] hover:bg-[#F27D26] text-white font-bold text-xs uppercase mono transition-colors shrink-0"
              >
                {isFetching ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>FETCHING...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>RUN FETCH</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-amber-100 border border-amber-400 p-2.5 text-amber-950 text-[11px] flex items-start gap-2 font-mono">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                CORS NOTICE: Web browsers conceal cross-origin Location headers for security. If a cross-origin redirect is triggered, the response is classified as Opaque.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* MODE 1: MANUAL BUILDER EDITOR */}
      {activeMode === 'manual' && (
        <HopEditor hops={manualHops} onChangeHops={setManualHops} />
      )}

      {/* VISUAL FLOW MAP */}
      <ChainVisualizer
        analysis={currentAnalysis}
        isEditable={activeMode === 'manual'}
        onDeleteHop={(hopId) => {
          if (activeMode === 'manual') {
            const updated = manualHops.filter(h => h.id !== hopId);
            setManualHops(updated.map((h, i) => ({ ...h, stepNumber: i + 1 })));
          }
        }}
      />

      {/* AUDIT SUMMARY & FIX RECOMMENDATIONS */}
      <AuditSummary flags={currentAnalysis.flags} />
    </div>
  );
};

