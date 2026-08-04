import React, { useState, useEffect } from 'react';
import { ParsedRobots, ParserMode, UrlTestResult } from '../types';
import { testUrl } from '../utils/robotsParser';
import {
  CheckCircle,
  XCircle,
  Search,
  Bot,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

interface UrlTesterProps {
  parsedRobots: ParsedRobots;
  parserMode: ParserMode;
  onHighlightLine?: (lineNumber: number | null) => void;
}

const COMMON_USER_AGENTS = [
  { label: 'Googlebot (Default Web)', value: 'Googlebot' },
  { label: 'Googlebot-Image (Google Images)', value: 'Googlebot-Image' },
  { label: 'Googlebot-News (Google News)', value: 'Googlebot-News' },
  { label: 'Bingbot (Microsoft Bing)', value: 'Bingbot' },
  { label: 'YandexBot (Yandex Search)', value: 'YandexBot' },
  { label: 'DuckDuckBot (DuckDuckGo)', value: 'DuckDuckBot' },
  { label: 'Wildcard (* All Crawlers)', value: '*' },
  { label: 'Custom User-Agent...', value: 'custom' },
];

export const UrlTester: React.FC<UrlTesterProps> = ({
  parsedRobots,
  parserMode,
  onHighlightLine,
}) => {
  const [testPath, setTestPath] = useState('/products/shoes');
  const [selectedUaOption, setSelectedUaOption] = useState('Googlebot');
  const [customUaText, setCustomUaText] = useState('');
  const [showCandidates, setShowCandidates] = useState(true);

  const activeUA =
    selectedUaOption === 'custom' ? customUaText || 'CustomBot' : selectedUaOption;

  const result: UrlTestResult = testUrl(
    parsedRobots,
    testPath || '/',
    activeUA,
    parserMode
  );

  useEffect(() => {
    if (result.winningRule) {
      onHighlightLine?.(result.winningRule.lineNumber);
    } else {
      onHighlightLine?.(null);
    }
  }, [result.winningRule, onHighlightLine]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-slate-100 text-sm tracking-wide">
            Test a URL / Path
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
          Evaluated via <strong className="text-slate-200 capitalize">{parserMode}</strong> rules
        </span>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* User Agent Selector */}
        <div className="md:col-span-5 space-y-1">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            Crawler User-Agent
          </label>
          <select
            value={selectedUaOption}
            onChange={(e) => setSelectedUaOption(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {COMMON_USER_AGENTS.map((ua) => (
              <option key={ua.value} value={ua.value}>
                {ua.label}
              </option>
            ))}
          </select>

          {selectedUaOption === 'custom' && (
            <input
              type="text"
              placeholder="Enter User-Agent string (e.g. Slurp)"
              value={customUaText}
              onChange={(e) => setCustomUaText(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          )}
        </div>

        {/* Path Input */}
        <div className="md:col-span-7 space-y-1">
          <label className="text-xs font-medium text-slate-300">
            Target Path or Full URL
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="/products/shoes or https://example.com/checkout"
              value={testPath}
              onChange={(e) => setTestPath(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs rounded-xl pl-3 pr-8 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {testPath && (
              <button
                onClick={() => setTestPath('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Output Verdict Card */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
          result.status === 'allowed'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-100'
        }`}
      >
        <div className="flex items-start space-x-3">
          {result.status === 'allowed' ? (
            <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-8 h-8 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  result.status === 'allowed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {result.status}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {result.urlOrPath}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug font-medium pt-1">
              {result.reason}
            </p>
          </div>
        </div>

        {result.matchedGroupUA && (
          <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/80 text-right shrink-0">
            <div className="text-[10px] text-slate-400 font-medium">Matched Group</div>
            <div className="text-xs font-mono text-indigo-300 font-bold">
              User-agent: {result.matchedGroupUA}
            </div>
          </div>
        )}
      </div>

      {/* Rule Evaluation Logic Breakdown */}
      {result.candidates.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowCandidates(!showCandidates)}
            className="w-full px-4 py-2.5 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Rule Match Specificity Breakdown ({result.candidates.length} candidate rules evaluated)
            </span>
            {showCandidates ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showCandidates && (
            <div className="p-3 space-y-2 overflow-x-auto text-xs">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-2">Line</th>
                    <th className="py-2 px-2">Directive</th>
                    <th className="py-2 px-2">Pattern</th>
                    <th className="py-2 px-2 text-center">Match Length</th>
                    <th className="py-2 px-2 text-right">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.candidates.map((cand, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        cand.won
                          ? 'bg-indigo-950/30 text-indigo-200 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      <td className="py-2 px-2">L{cand.rule.lineNumber}</td>
                      <td className="py-2 px-2">
                        <span
                          className={
                            cand.type === 'allow'
                              ? 'text-emerald-400 font-semibold'
                              : 'text-rose-400 font-semibold'
                          }
                        >
                          {cand.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-200">
                        {cand.pattern}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-300">
                        {cand.patternLength} chars
                      </td>
                      <td className="py-2 px-2 text-right">
                        {cand.won ? (
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            WINNER
                          </span>
                        ) : cand.isMatch ? (
                          <span className="text-slate-500 text-[10px]">
                            Matched (Lost tie)
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">No Match</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
