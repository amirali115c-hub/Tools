import React, {useState} from 'react';
import {InputMode, AnalysisTab, CrawlResult} from './types';
import {InputPanel} from './components/InputPanel';
import {ResultsPanel} from './components/ResultsPanel';
import {EmptyState} from './components/EmptyState';

const tabs: {id: AnalysisTab; label: string; group: string; icon: string}[] = [
  {id: 'overview', label: 'Overview', group: 'basic', icon: '📊'},
  {id: 'meta', label: 'Meta Tags', group: 'basic', icon: '🏷️'},
  {id: 'headings', label: 'Headings', group: 'basic', icon: '📑'},
  {id: 'links', label: 'Links', group: 'basic', icon: '🔗'},
  {id: 'images', label: 'Images', group: 'basic', icon: '🖼️'},
  {id: 'schema', label: 'Schema', group: 'basic', icon: '📋'},
  {id: 'social', label: 'Social', group: 'basic', icon: '📱'},
  {id: 'issues', label: 'Issues', group: 'basic', icon: '⚠️'},
  {id: 'rendering', label: 'JS Rendering', group: 'advanced', icon: '⚡'},
  {id: 'ai-crawlers', label: 'AI Crawlers', group: 'advanced', icon: '🤖'},
  {id: 'llms-txt', label: 'llms.txt', group: 'advanced', icon: '📄'},
  {id: 'cwv', label: 'CWV', group: 'advanced', icon: '📈'},
  {id: 'js-health', label: 'JS Health', group: 'advanced', icon: '💊'},
  {id: 'migration', label: 'Migration', group: 'advanced', icon: '🔄'},
];

export default function App() {
  const [inputMode, setInputMode] = useState<InputMode>('url');
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header - Minimal branding only */}
      <header className="border-b border-slate-900 bg-slate-950/95 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white">Free SEO Checker</h1>
                <p className="text-[11px] text-slate-500">Website SEO Score Tool — 14 Analysis Tabs</p>
              </div>
            </div>
            {result && (
              <div className="hidden md:flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">Analyzed</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Input Section - Always at top */}
        <div className="mb-6">
          <InputPanel
            inputMode={inputMode}
            setInputMode={setInputMode}
            onResult={setResult}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            error={error}
            setError={setError}
          />
        </div>

        {/* Results Section */}
        {result ? (
          <div className="space-y-4">
            {/* Tabs - Directly above results, sticky */}
            <div className="sticky top-14 z-40 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-3">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? tab.group === 'advanced'
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                          : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-sm">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <ResultsPanel
              result={result}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>
        ) : (
          <EmptyState isLoading={isLoading} />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Free SEO Checker — JavaScript SEO Auditor for Agencies</span>
          <span className="font-mono text-[11px] text-slate-600">
            Client-Side Execution &bull; Zero External Logging &bull; 100% Private
          </span>
        </div>
      </footer>
    </div>
  );
}
