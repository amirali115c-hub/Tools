import React from 'react';
import { Search, FileCode, Layers, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'single' | 'bulk';
  setActiveTab: (tab: 'single' | 'bulk') => void;
  onSelectPreset: (presetId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="border-b-4 border-slate-900 bg-slate-900 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-slate-900 border-2 border-white flex items-center justify-center font-black text-lg shadow-xs">
              <Search className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  Canonical Tag Checker
                </h1>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-emerald-400 text-slate-950 border-2 border-slate-950">
                  SEO Audit Pro
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-300">
                100% Client-Side rel=&quot;canonical&quot; Signal & Failure Pattern Analyzer
              </p>
            </div>
          </div>

          {/* Mode Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 border-2 border-slate-700 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center gap-2 px-4 py-2 font-black uppercase text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-white text-slate-900 border-2 border-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileCode className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <span>Single Page / HTML</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center gap-2 px-4 py-2 font-black uppercase text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'bulk'
                  ? 'bg-white text-slate-900 border-2 border-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-500 stroke-[2.5]" />
              <span>Bulk / Section Audit</span>
            </button>
          </div>

          {/* Client-Side Safety Badge */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200 bg-slate-800 px-3.5 py-2 border-2 border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
            <span>Zero Server Latency • CORS Safe Paste</span>
          </div>
        </div>
      </div>
    </header>
  );
};

