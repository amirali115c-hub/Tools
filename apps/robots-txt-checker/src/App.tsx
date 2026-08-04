import React, { useState } from 'react';
import { ParserMode } from './types';
import { SAMPLE_ROBOTS_PRESETS } from './data/samples';
import { Header } from './components/Header';
import { CheckerTab } from './components/CheckerTab';
import { GeneratorTab } from './components/GeneratorTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'checker' | 'generator'>('checker');
  const [parserMode, setParserMode] = useState<ParserMode>('google');
  
  // Pre-load realistic sample content on first load so the app is never a blank page
  const [rawText, setRawText] = useState<string>(
    SAMPLE_ROBOTS_PRESETS[0].content
  );

  const handleSelectPreset = (presetId: string) => {
    const preset = SAMPLE_ROBOTS_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setRawText(preset.content);
      setActiveTab('checker');
    }
  };

  const handleSendToGenerator = (text: string) => {
    // Optionally update raw text or switch tabs
    setActiveTab('generator');
  };

  const handleTestInChecker = (text: string) => {
    setRawText(text);
    setActiveTab('checker');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation & Controls Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        parserMode={parserMode}
        setParserMode={setParserMode}
        onSelectPreset={handleSelectPreset}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'checker' ? (
          <CheckerTab
            rawText={rawText}
            setRawText={setRawText}
            parserMode={parserMode}
            onSendToGenerator={handleSendToGenerator}
          />
        ) : (
          <GeneratorTab onTestInChecker={handleTestInChecker} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Robots.txt Inspector & Generator — RFC 9309 & Googlebot Standard Compliant
          </span>
          <span className="font-mono text-[11px] text-slate-600">
            Client-Side Execution • Zero External Logging • 100% Offline Capable
          </span>
        </div>
      </footer>
    </div>
  );
}
