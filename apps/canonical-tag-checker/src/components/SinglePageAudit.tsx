import React, { useState, useEffect } from 'react';
import { PageAuditResult, SamplePreset, Severity } from '../types';
import { auditPage } from '../utils/canonicalAnalyzer';
import { SAMPLE_PRESETS, DEFAULT_SINGLE_SAMPLE } from '../data/samplePages';
import { IssueCard } from './IssueCard';
import { HeadCodeViewer } from './HeadCodeViewer';
import { exportResultsToCSV } from '../utils/csvExporter';
import {
  Play,
  Globe,
  FileText,
  AlertOctagon,
  Download,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

export const SinglePageAudit: React.FC = () => {
  const [inputMode, setInputMode] = useState<'html' | 'url'>('html');
  const [pageUrl, setPageUrl] = useState<string>(DEFAULT_SINGLE_SAMPLE.pageUrl);
  const [htmlSource, setHtmlSource] = useState<string>(DEFAULT_SINGLE_SAMPLE.html);
  const [headersSource, setHeadersSource] = useState<string>(DEFAULT_SINGLE_SAMPLE.headers || '');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [corsError, setCorsError] = useState<string | null>(null);

  // Target Status Override for unverified target check testing
  const [targetStatusCode, setTargetStatusCode] = useState<number>(200);
  const [targetNoIndex, setTargetNoIndex] = useState<boolean>(false);

  // Filter state
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'all'>('all');

  // Audit Result
  const [auditResult, setAuditResult] = useState<PageAuditResult | null>(null);

  // Perform initial audit on mount with default pre-loaded sample
  useEffect(() => {
    runAudit(DEFAULT_SINGLE_SAMPLE.pageUrl, DEFAULT_SINGLE_SAMPLE.html, DEFAULT_SINGLE_SAMPLE.headers || '');
  }, []);

  const runAudit = (url: string, html: string, headers: string = '') => {
    const result = auditPage(url, html, headers, {
      statusCode: targetStatusCode,
      hasNoIndex: targetNoIndex,
    });
    setAuditResult(result);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCorsError(null);
    if (inputMode === 'url') {
      fetchPageByUrl(pageUrl);
    } else {
      runAudit(pageUrl, htmlSource, headersSource);
    }
  };

  const fetchPageByUrl = async (targetUrl: string) => {
    if (!targetUrl) return;
    let formattedUrl = targetUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
      setPageUrl(formattedUrl);
    }

    setIsLoading(true);
    setCorsError(null);

    try {
      const response = await fetch(formattedUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const fetchedHtml = await response.text();

      // Extract raw response headers if exposed
      let fetchedHeaders = '';
      response.headers.forEach((val, key) => {
        fetchedHeaders += `${key}: ${val}\n`;
      });

      setHtmlSource(fetchedHtml);
      setHeadersSource(fetchedHeaders);
      runAudit(formattedUrl, fetchedHtml, fetchedHeaders);
    } catch (err: any) {
      console.warn('Fetch error:', err);
      setCorsError(
        `CORS or Network blocked client-side fetch for "${formattedUrl}".\n\nFallback Recommendation:\n1. Open the URL in a new browser tab.\n2. Press Ctrl+U (or View Source) and copy the page HTML.\n3. Switch input mode to "Paste Raw HTML" and paste it directly.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreset = (preset: SamplePreset) => {
    setPageUrl(preset.pageUrl);
    setHtmlSource(preset.html);
    setHeadersSource(preset.headers || '');
    setInputMode('html');
    setCorsError(null);
    runAudit(preset.pageUrl, preset.html, preset.headers || '');
  };

  const filteredIssues = auditResult
    ? auditResult.issues.filter((i) => {
        if (filterSeverity === 'all') return true;
        return i.severity === filterSeverity;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Quick Preset Selector Toolbar */}
      <div className="bg-white border-4 border-slate-900 p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
              1-Click SEO Benchmark Scenarios
            </h3>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Test real-world canonical failure patterns instantly
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset)}
              className="text-left p-3.5 border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all bg-slate-50 group font-bold cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-white">
                  {preset.title}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-slate-900 bg-slate-900 text-white group-hover:bg-white group-hover:text-slate-900">
                  {preset.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 group-hover:text-slate-200 line-clamp-2 leading-relaxed font-semibold">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Input Section */}
      <div className="bg-white border-4 border-slate-900 p-5 sm:p-6 shadow-md space-y-4">
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-900">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-900 stroke-[2.5]" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                Single Page Analysis Input
              </h2>
            </div>

            {/* Input Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 border-2 border-slate-900 text-xs font-black uppercase">
              <button
                type="button"
                onClick={() => setInputMode('html')}
                className={`px-3.5 py-1.5 transition-all cursor-pointer ${
                  inputMode === 'html'
                    ? 'bg-slate-900 text-white font-black border-2 border-slate-900'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Paste Raw HTML (Primary / Safe)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`px-3.5 py-1.5 transition-all cursor-pointer ${
                  inputMode === 'url'
                    ? 'bg-slate-900 text-white font-black border-2 border-slate-900'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Fetch Page URL
              </button>
            </div>
          </div>

          {/* Page URL Input */}
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
              Target Document URL (Required for resolving relative canonicals)
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none stroke-[2.5]" />
              <input
                type="url"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                placeholder="https://www.example.com/products/item-1?utm_source=google"
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-900 bg-slate-50 text-slate-900 text-sm font-mono font-bold focus:outline-none focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Raw HTML Paste (if in html mode) */}
          {inputMode === 'html' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                  Raw HTML Source Code (Paste View Source / Ctrl+U)
                </label>
                <span className="text-xs text-slate-600 font-mono font-bold">
                  {htmlSource.length.toLocaleString()} characters
                </span>
              </div>
              <textarea
                value={htmlSource}
                onChange={(e) => setHtmlSource(e.target.value)}
                rows={8}
                placeholder="<!DOCTYPE html><html><head><link rel=&quot;canonical&quot; href=&quot;...&quot;></head>..."
                className="w-full p-4 border-2 border-slate-900 bg-slate-950 text-emerald-400 text-xs font-mono font-bold focus:outline-none leading-relaxed"
                required
              />
            </div>
          )}

          {/* Expandable Response Headers Input */}
          <details className="group border-2 border-slate-900 bg-slate-50">
            <summary className="p-3.5 text-xs font-black uppercase tracking-wider text-slate-900 cursor-pointer flex items-center justify-between select-none">
              <span>Optional: Paste HTTP Response Headers (for Link: rel=canonical check)</span>
              <span className="text-slate-900 font-black group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-3.5 pt-0 border-t-2 border-slate-900 mt-2">
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Paste HTTP headers (e.g., from Network DevTools tab or curl -I) to check for header-level canonical signals.
              </p>
              <textarea
                value={headersSource}
                onChange={(e) => setHeadersSource(e.target.value)}
                rows={3}
                placeholder={`HTTP/1.1 200 OK\nLink: <https://www.example.com/canonical-target>; rel="canonical"`}
                className="w-full p-3 border-2 border-slate-900 bg-slate-950 text-slate-100 text-xs font-mono font-bold focus:outline-none"
              />
            </div>
          </details>

          {/* CORS Error Alert if URL fetch fails */}
          {corsError && (
            <div className="p-4 bg-amber-50 border-2 border-slate-900 text-slate-900 text-xs sm:text-sm font-semibold whitespace-pre-wrap leading-relaxed flex items-start gap-3 shadow-xs">
              <AlertOctagon className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 stroke-[2.5]" />
              <div>
                <span className="font-black uppercase tracking-wider block mb-1">CORS Limitation Detected</span>
                {corsError}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-wider border-b-4 border-slate-950 active:translate-y-0.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>Fetching & Auditing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current stroke-[2.5]" />
                  <span>Run Canonical Audit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Audit Results Dashboard */}
      {auditResult && (
        <div className="space-y-6">
          {/* Summary Score Header & KPI Banner */}
          <div className="bg-white border-4 border-slate-900 p-5 sm:p-6 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b-2 border-slate-900">
              {/* Score Gauge */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-20 h-20 border-4 border-slate-900 flex flex-col items-center justify-center font-black text-3xl text-white shadow-md ${
                    auditResult.score >= 80
                      ? 'bg-emerald-600'
                      : auditResult.score >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-600'
                  }`}
                >
                  <span>{auditResult.score}</span>
                  <span className="text-[10px] uppercase font-black tracking-widest opacity-90">Score</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      Canonical Health Audit
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-600 truncate max-w-xs">
                      {auditResult.pageUrl}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    Document Title: <strong className="text-slate-900">{auditResult.title}</strong>
                  </p>
                </div>
              </div>

              {/* Status Breakdown Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3.5 py-2 border-2 border-slate-900 bg-emerald-100 text-slate-950 flex items-center gap-2 text-xs font-black uppercase shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800 stroke-[2.5]" />
                  <span>{auditResult.stats.passes} Passes</span>
                </div>

                <div className="px-3.5 py-2 border-2 border-slate-900 bg-amber-100 text-slate-950 flex items-center gap-2 text-xs font-black uppercase shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-800 stroke-[2.5]" />
                  <span>{auditResult.stats.warnings} Warnings</span>
                </div>

                <div className="px-3.5 py-2 border-2 border-slate-900 bg-rose-100 text-slate-950 flex items-center gap-2 text-xs font-black uppercase shadow-xs">
                  <XCircle className="w-4 h-4 text-rose-800 stroke-[2.5]" />
                  <span>{auditResult.stats.fails} Hard Errors</span>
                </div>

                {auditResult.stats.unverified > 0 && (
                  <div className="px-3.5 py-2 border-2 border-slate-900 bg-purple-100 text-slate-950 flex items-center gap-2 text-xs font-black uppercase shadow-xs">
                    <HelpCircle className="w-4 h-4 text-purple-800 stroke-[2.5]" />
                    <span>{auditResult.stats.unverified} Unverified</span>
                  </div>
                )}
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 border-2 border-slate-900 bg-slate-50">
                <span className="text-slate-600 font-black text-[10px] uppercase tracking-widest block mb-1">Canonical Target:</span>
                <span className="font-mono font-bold text-slate-900 truncate block" title={auditResult.canonicalTarget || 'None'}>
                  {auditResult.canonicalTarget || 'None Declared'}
                </span>
              </div>

              <div className="p-3.5 border-2 border-slate-900 bg-slate-50">
                <span className="text-slate-600 font-black text-[10px] uppercase tracking-widest block mb-1">Self-Referencing?</span>
                <span className={`font-mono font-bold ${auditResult.isSelfCanonical ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {auditResult.isSelfCanonical ? 'YES (Healthy)' : 'NO (Points Elsewhere)'}
                </span>
              </div>

              <div className="p-3.5 border-2 border-slate-900 bg-slate-50">
                <span className="text-slate-600 font-black text-[10px] uppercase tracking-widest block mb-1">Cross-Domain?</span>
                <span className={`font-mono font-bold ${auditResult.isCrossDomain ? 'text-amber-700' : 'text-slate-900'}`}>
                  {auditResult.isCrossDomain ? 'YES (Check Domain)' : 'NO (Same Host)'}
                </span>
              </div>

              <div className="p-3.5 border-2 border-slate-900 bg-slate-50">
                <span className="text-slate-600 font-black text-[10px] uppercase tracking-widest block mb-1">Relative URL?</span>
                <span className={`font-mono font-bold ${auditResult.isRelative ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {auditResult.isRelative ? 'YES (Warning)' : 'NO (Absolute)'}
                </span>
              </div>
            </div>
          </div>

          {/* Target Status Simulation Controls (for client-side testing when CORS prevents fetch) */}
          <div className="bg-slate-900 text-white p-5 border-4 border-slate-900 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-100">
                  Simulate Target HTTP Response
                </h4>
              </div>
              <span className="text-xs font-bold text-slate-300">
                Test how target HTTP status affects canonical validity
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">Target Page HTTP Status Code:</label>
                <select
                  value={targetStatusCode}
                  onChange={(e) => {
                    const code = parseInt(e.target.value, 10);
                    setTargetStatusCode(code);
                    runAudit(pageUrl, htmlSource, headersSource);
                  }}
                  className="w-full p-3 border-2 border-slate-700 bg-slate-950 text-slate-100 font-mono font-bold focus:outline-none"
                >
                  <option value={200}>200 OK (Standard Live Page)</option>
                  <option value={301}>301 Permanent Redirect (Invalid Target)</option>
                  <option value={404}>404 Not Found (Broken Target)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="targetNoIndex"
                  checked={targetNoIndex}
                  onChange={(e) => {
                    setTargetNoIndex(e.target.checked);
                    runAudit(pageUrl, htmlSource, headersSource);
                  }}
                  className="w-4 h-4 border-2 border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="targetNoIndex" className="text-slate-200 font-bold uppercase tracking-wide cursor-pointer select-none">
                  Simulate Target Page carry noindex tag
                </label>
              </div>
            </div>
          </div>

          {/* Extracted Head Inspector */}
          <HeadCodeViewer parsedData={auditResult.parsedData} />

          {/* Filter Bar & Export Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 mr-2">Filter Checks:</span>
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-3.5 py-2 border-2 border-slate-900 text-xs font-black uppercase transition-all cursor-pointer shadow-xs ${
                  filterSeverity === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-900 hover:bg-slate-100'
                }`}
              >
                All ({auditResult.issues.length})
              </button>
              <button
                onClick={() => setFilterSeverity('fail')}
                className={`px-3.5 py-2 border-2 border-slate-900 text-xs font-black uppercase transition-all cursor-pointer shadow-xs ${
                  filterSeverity === 'fail'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-100 text-slate-950 hover:bg-rose-200'
                }`}
              >
                Errors ({auditResult.stats.fails})
              </button>
              <button
                onClick={() => setFilterSeverity('warning')}
                className={`px-3.5 py-2 border-2 border-slate-900 text-xs font-black uppercase transition-all cursor-pointer shadow-xs ${
                  filterSeverity === 'warning'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-amber-100 text-slate-950 hover:bg-amber-200'
                }`}
              >
                Warnings ({auditResult.stats.warnings})
              </button>
              <button
                onClick={() => setFilterSeverity('pass')}
                className={`px-3.5 py-2 border-2 border-slate-900 text-xs font-black uppercase transition-all cursor-pointer shadow-xs ${
                  filterSeverity === 'pass'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 text-slate-950 hover:bg-emerald-200'
                }`}
              >
                Passes ({auditResult.stats.passes})
              </button>
            </div>

            <button
              onClick={() => exportResultsToCSV([auditResult])}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-black text-xs uppercase tracking-wider border-b-4 border-slate-950 active:translate-y-0.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Export CSV Audit Report</span>
            </button>
          </div>

          {/* Audit Issues List */}
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}

            {filteredIssues.length === 0 && (
              <div className="p-8 text-center bg-white border-4 border-slate-900 text-slate-700 font-bold text-sm uppercase">
                No checks found matching filter state &quot;{filterSeverity}&quot;.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

