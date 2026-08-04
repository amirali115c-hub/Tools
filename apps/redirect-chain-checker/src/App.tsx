import React, { useState, useEffect } from 'react';
import { ChainAnalysis } from './types';
import { Header } from './components/Header';
import { CorsBanner } from './components/CorsBanner';
import { SingleChainAnalyzer } from './components/SingleChainAnalyzer';
import { BulkAnalyzer } from './components/BulkAnalyzer';
import { SavedChains } from './components/SavedChains';

export default function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'saved'>('single');
  const [savedChains, setSavedChains] = useState<ChainAnalysis[]>([]);
  const [selectedChainToAnalyze, setSelectedChainToAnalyze] = useState<ChainAnalysis | undefined>();

  // Load saved chains from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('redirect_chains_history');
      if (stored) {
        setSavedChains(JSON.parse(stored));
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  // Save chain to history
  const handleSaveChain = (analysis: ChainAnalysis) => {
    const updated = [analysis, ...savedChains.filter(c => c.id !== analysis.id)];
    setSavedChains(updated);
    try {
      localStorage.setItem('redirect_chains_history', JSON.stringify(updated));
    } catch {
      // Ignore storage write errors
    }
  };

  // Delete saved chain
  const handleDeleteChain = (id: string) => {
    const updated = savedChains.filter(c => c.id !== id);
    setSavedChains(updated);
    try {
      localStorage.setItem('redirect_chains_history', JSON.stringify(updated));
    } catch {
      // Ignore storage write errors
    }
  };

  // Clear all saved history
  const handleClearAllSaved = () => {
    setSavedChains([]);
    try {
      localStorage.removeItem('redirect_chains_history');
    } catch {
      // Ignore storage write errors
    }
  };

  // Load chain from bulk or saved into single analyzer
  const handleLoadIntoSingle = (analysis: ChainAnalysis) => {
    setSelectedChainToAnalyze(analysis);
    setActiveTab('single');
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-mono selection:bg-[#F27D26] selection:text-white flex flex-col">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedCount={savedChains.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Persistent CORS Security Boundary Notice */}
        <CorsBanner />

        {/* Tab Views */}
        {activeTab === 'single' && (
          <SingleChainAnalyzer
            onSaveChain={handleSaveChain}
            initialAnalysis={selectedChainToAnalyze}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkAnalyzer onLoadIntoSingle={handleLoadIntoSingle} />
        )}

        {activeTab === 'saved' && (
          <SavedChains
            savedChains={savedChains}
            onDeleteChain={handleDeleteChain}
            onClearAll={handleClearAllSaved}
            onSelectChain={handleLoadIntoSingle}
          />
        )}
      </main>

      <footer className="border-t border-[#141414] bg-white py-4 text-center text-xs font-mono uppercase text-[#141414]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-bold">
            HTTP REDIRECT CHAIN CHECKER — TECHNICAL AUDIT ENGINE
          </p>
          <p className="text-[11px] font-medium opacity-80">
            CLIENT-SIDE BROWSER CORS BOUNDARY TRANSPARENCY
          </p>
        </div>
      </footer>
    </div>

  );
}
