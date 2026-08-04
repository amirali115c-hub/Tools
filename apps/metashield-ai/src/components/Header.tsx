import React from 'react';
import { ShieldCheck, Eye, Sparkles, FileImage, Cpu } from 'lucide-react';

interface HeaderProps {
  fileCount: number;
  totalTagsCount: number;
  cleanedCount: number;
  hasGpsLeaks: boolean;
  activeTab: 'inspector' | 'forensics' | 'audit' | 'cleaner' | 'batch';
  setActiveTab: (tab: 'inspector' | 'forensics' | 'audit' | 'cleaner' | 'batch') => void;
}

export const Header: React.FC<HeaderProps> = ({
  fileCount,
  totalTagsCount,
  cleanedCount,
  hasGpsLeaks,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">MetaShield AI</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Studio v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400">EXIF & AI Metadata Inspector, Privacy Audit & Forensic Scrubber</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'inspector'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            Metadata Inspector
            {totalTagsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'inspector' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}>
                {totalTagsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('forensics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'forensics'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Visual Forensics (ELA)
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
              activeTab === 'audit'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 font-semibold'
                : 'text-indigo-300 hover:text-indigo-100 hover:bg-indigo-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            Gemini Privacy Audit
          </button>

          <button
            onClick={() => setActiveTab('cleaner')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'cleaner'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Scrubber Studio
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'batch'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Batch Queue
            {fileCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'batch' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}>
                {fileCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
