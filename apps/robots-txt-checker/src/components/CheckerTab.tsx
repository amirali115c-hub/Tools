import React, { useState } from 'react';
import { ParsedRobots, ParserMode } from '../types';
import { parseRobotsTxt } from '../utils/robotsParser';
import { analyzeRobotsTxt } from '../utils/robotsAnalyzer';
import { CodeViewer } from './CodeViewer';
import { UrlTester } from './UrlTester';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { SAMPLE_ROBOTS_PRESETS } from '../data/samples';
import {
  Globe,
  FileCode,
  ExternalLink,
  AlertCircle,
  Wrench,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface CheckerTabProps {
  rawText: string;
  setRawText: (text: string) => void;
  parserMode: ParserMode;
  onSendToGenerator: (text: string) => void;
}

export const CheckerTab: React.FC<CheckerTabProps> = ({
  rawText,
  setRawText,
  parserMode,
  onSendToGenerator,
}) => {
  const [inputMode, setInputMode] = useState<'paste' | 'url'>('paste');
  const [targetUrl, setTargetUrl] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [corsError, setCorsError] = useState<{
    domain: string;
    fullUrl: string;
    message: string;
  } | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  const parsed: ParsedRobots = parseRobotsTxt(rawText);
  const diagnostics = analyzeRobotsTxt(parsed);

  const handleFetchUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setCorsError(null);
    setFetchingUrl(true);

    let formattedUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    let urlObj: URL;
    try {
      urlObj = new URL(formattedUrl);
      if (!urlObj.pathname.endsWith('/robots.txt')) {
        urlObj.pathname = urlObj.pathname.replace(/\/$/, '') + '/robots.txt';
      }
    } catch {
      setCorsError({
        domain: targetUrl,
        fullUrl: formattedUrl,
        message: 'Invalid URL format provided.',
      });
      setFetchingUrl(false);
      return;
    }

    const finalRobotsUrl = urlObj.toString();

    try {
      const response = await fetch(finalRobotsUrl, {
        method: 'GET',
        headers: { Accept: 'text/plain, */*' },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      setRawText(text);
      setInputMode('paste');
    } catch (err: any) {
      // Specifically catch CORS / Fetch Network Error
      setCorsError({
        domain: urlObj.hostname,
        fullUrl: finalRobotsUrl,
        message:
          'Browser Cross-Origin Resource Sharing (CORS) restriction blocked client-side fetching.',
      });
    } finally {
      setFetchingUrl(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Input Mode Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setInputMode('paste')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                inputMode === 'paste'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Direct Raw Text / Paste</span>
            </button>

            <button
              onClick={() => setInputMode('url')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                inputMode === 'url'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Fetch URL</span>
            </button>
          </div>

          <button
            onClick={() => onSendToGenerator(rawText)}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Send to Visual Generator</span>
          </button>
        </div>

        {/* URL Fetch Input Box */}
        {inputMode === 'url' && (
          <form onSubmit={handleFetchUrl} className="space-y-3 pt-1">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Enter domain or URL (e.g., github.com or https://example.com)"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={fetchingUrl}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shrink-0"
              >
                {fetchingUrl ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Fetch robots.txt</span>
                  </>
                )}
              </button>
            </div>

            {/* CORS Error Fallback Card */}
            {corsError && (
              <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-3 text-amber-200 text-xs">
                <div className="flex items-start space-x-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-amber-100 text-xs">
                      CORS Restriction Detected for {corsError.domain}
                    </h4>
                    <p className="text-amber-300/90 leading-relaxed">
                      Web browsers block direct client-side fetch requests to third-party domains when Access-Control-Allow-Origin headers are omitted by the server.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={corsError.fullUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 transition-colors"
                  >
                    <span>Open {corsError.fullUrl} in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-slate-400">
                    Copy the raw text in the new tab and paste it into the editor.
                  </span>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Sample Preset Buttons */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-1 pb-1">
          <span className="text-xs text-slate-400 shrink-0 font-medium">
            Sample Scenarios:
          </span>
          {SAMPLE_ROBOTS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setRawText(preset.content);
                setCorsError(null);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] rounded-lg border border-slate-700/80 whitespace-nowrap transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Code Editor View */}
        <div className="lg:col-span-6 space-y-4">
          <CodeViewer
            rawText={rawText}
            onTextChange={setRawText}
            parsedLines={parsed.lines}
            diagnostics={diagnostics}
            highlightedLineNumber={highlightedLine}
            byteSize={parsed.byteSize}
          />
        </div>

        {/* Right Column: Tester & Diagnostics */}
        <div className="lg:col-span-6 space-y-6">
          <UrlTester
            parsedRobots={parsed}
            parserMode={parserMode}
            onHighlightLine={setHighlightedLine}
          />

          <DiagnosticsPanel
            diagnostics={diagnostics}
            onHighlightLine={setHighlightedLine}
          />
        </div>
      </div>
    </div>
  );
};
