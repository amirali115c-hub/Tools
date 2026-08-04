import React, { useState } from 'react';
import { ParserMode } from '../types';
import { SAMPLE_ROBOTS_PRESETS } from '../data/samples';
import {
  FileText,
  Wrench,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'checker' | 'generator';
  setActiveTab: (tab: 'checker' | 'generator') => void;
  parserMode: ParserMode;
  setParserMode: (mode: ParserMode) => void;
  onSelectPreset?: (presetId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  parserMode,
  setParserMode,
  onSelectPreset,
}) => {
  const [showModeModal, setShowModeModal] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-mono font-bold text-lg">
                r.t
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Robots.txt Inspector
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    RFC 9309 & Googlebot
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Client-side parser, specificity analyzer & visual editor
                </p>
              </div>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="sm:hidden flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveTab('checker')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'checker'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Checker
              </button>
              <button
                onClick={() => setActiveTab('generator')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'generator'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Generator
              </button>
            </div>
          </div>

          {/* Center Tabs (Desktop) */}
          <div className="hidden sm:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setActiveTab('checker')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'checker'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Checker & URL Tester</span>
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'generator'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Visual Generator</span>
            </button>
          </div>

          {/* Right Controls: Parser Mode Toggle */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            {/* Quick Presets (Only in Checker) */}
            {activeTab === 'checker' && onSelectPreset && (
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onSelectPreset(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="" disabled>
                    ⚡ Load Preset Sample...
                  </option>
                  {SAMPLE_ROBOTS_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setParserMode('google')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
                  parserMode === 'google'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Googlebot mode: Allow wins ties of equal pattern length"
              >
                <span>Google Mode</span>
              </button>
              <button
                onClick={() => setParserMode('rfc9309')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
                  parserMode === 'rfc9309'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Strict RFC 9309 mode: First matching rule in file wins equal-length ties"
              >
                <span>Strict RFC</span>
              </button>
              <button
                onClick={() => setShowModeModal(true)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md"
                title="Explain Mode Differences"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Differences Modal */}
      {showModeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  Google Mode vs. Strict RFC 9309 Mode
                </h3>
              </div>
              <button
                onClick={() => setShowModeModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Google-Flavored Mode (Default)
                </div>
                <p>
                  1. Longest matching rule pattern length wins.
                  <br />
                  2. <strong>Tie Breaker:</strong> On a tie between an{' '}
                  <code className="text-emerald-300">Allow:</code> and a{' '}
                  <code className="text-rose-300">Disallow:</code> pattern of{' '}
                  <em>exact equal length</em>, <strong>Allow wins</strong>!
                </p>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-1">
                <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  Strict RFC 9309 Mode
                </div>
                <p>
                  1. Longest matching pattern length wins.
                  <br />
                  2. <strong>Tie Breaker:</strong> On an equal length tie, the rule that appears <strong>first in line order</strong> inside the file wins.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl space-y-1 border border-slate-700">
                <div className="font-semibold text-slate-200">Example Scenario:</div>
                <pre className="p-2 bg-slate-950 rounded font-mono text-[11px] text-amber-300">
                  Disallow: /products/
                  <br />
                  Allow: /products/
                </pre>
                <p className="text-slate-400">
                  Testing path <code className="text-slate-200">/products/shoes</code>: Both patterns are length 10.
                  <br />• <strong>Google Mode:</strong> ALLOWED (Allow beats Disallow tie).
                  <br />• <strong>Strict RFC Mode:</strong> BLOCKED (Disallow appeared first on line 1).
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowModeModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
