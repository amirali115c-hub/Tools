import React, {useState} from 'react';
import {InputMode, AnalysisTab, CrawlResult} from './types';
import {Header} from './components/Header';
import {InputPanel} from './components/InputPanel';
import {ResultsPanel} from './components/ResultsPanel';
import {EmptyState} from './components/EmptyState';

export default function App() {
  const [inputMode, setInputMode] = useState<InputMode>('url');
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasResult={!!result}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
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
          <div className="lg:col-span-2">
            {result ? (
              <ResultsPanel
                result={result}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            ) : (
              <EmptyState isLoading={isLoading} />
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            JS SEO Crawler - JavaScript SEO Auditor for Agencies
          </span>
          <span className="font-mono text-[11px] text-slate-600">
            Client-Side Execution &bull; Zero External Logging &bull; 100% Private
          </span>
        </div>
      </footer>
    </div>
  );
}
