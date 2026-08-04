import React from 'react';
import { ShieldCheck, Sparkles, RefreshCw, Layers, FileText, Target, CheckCircle2, Layers3, Cpu, Network, Compass } from 'lucide-react';
import { AppState } from '../types';

interface NavbarProps {
  activeTab: AppState['activeTab'];
  setActiveTab: (tab: AppState['activeTab']) => void;
  onLoadSampleData: () => void;
  onResetSession: () => void;
  competitorPageCount: number;
  ownPageCount: number;
  gapCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onLoadSampleData,
  onResetSession,
  competitorPageCount,
  ownPageCount,
  gapCount
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
          
          {/* Logo & Security Badge */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-500 via-purple-600 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight">
                  OptiPath Enterprise SEO Intelligence Suite
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> Client-Side AI Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Topical Authority Hubs • Entity NER & Schema • Cannibalization Network • E-E-A-T Quality Briefs
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={onLoadSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all cursor-pointer"
              title="Load realistic sample competitor and own-site pages for a quick 1-click test"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              1-Click Demo Data
            </button>
            <button
              onClick={onResetSession}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
              title="Clear all saved pages and start fresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              Clear Session
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 border-t border-slate-800/80 pt-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setActiveTab('intake')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'intake'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Intake
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {competitorPageCount + ownPageCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            2. Pages
          </button>

          <button
            onClick={() => setActiveTab('gaps')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gaps'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            3. Gap Analysis
            {gapCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                {gapCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('clusters')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'clusters'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Layers3 className="w-3.5 h-3.5 text-indigo-400" />
            4. Topic Clusters
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'entities'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            5. Entities & Schema
          </button>

          <button
            onClick={() => setActiveTab('linking')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'linking'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            6. Internal Link Network
          </button>

          <button
            onClick={() => setActiveTab('intent')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'intent'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            7. Intent & E-E-A-T
          </button>

          <button
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'plan'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            8. Final Plan & Briefs
          </button>
        </nav>

      </div>
    </header>
  );
};
