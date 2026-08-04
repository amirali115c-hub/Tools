import React from 'react';
import { Network, Sliders, ListFilter, Bookmark } from 'lucide-react';

interface HeaderProps {
  activeTab: 'single' | 'bulk' | 'saved';
  onTabChange: (tab: 'single' | 'bulk' | 'saved') => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, savedCount }) => {
  return (
    <header className="bg-white border-b border-[#141414] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between flex-wrap gap-3">
        {/* App Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-[#141414] text-white p-1.5 flex items-center justify-center">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg tracking-tighter text-[#141414] uppercase">
                LINKHOP_ANALYZER_v1.0
              </h1>
              <span className="mono text-[10px] bg-[#141414] text-white px-1.5 py-0.5 font-bold">
                OPERATIONAL
              </span>
            </div>
            <p className="mono text-[10px] text-[#141414] opacity-60">
              CLIENT-SIDE REDIRECT MAPPER &amp; AUDITOR
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 text-xs font-semibold uppercase">
          <button
            onClick={() => onTabChange('single')}
            className={`px-3 py-1.5 border border-[#141414] transition-all flex items-center gap-1.5 ${
              activeTab === 'single'
                ? 'bg-[#141414] text-white tech-shadow-sm'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Single URL</span>
          </button>

          <button
            onClick={() => onTabChange('bulk')}
            className={`px-3 py-1.5 border border-[#141414] transition-all flex items-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'bg-[#141414] text-white tech-shadow-sm'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Bulk Audit</span>
          </button>

          <button
            onClick={() => onTabChange('saved')}
            className={`px-3 py-1.5 border border-[#141414] transition-all flex items-center gap-1.5 relative ${
              activeTab === 'saved'
                ? 'bg-[#141414] text-white tech-shadow-sm'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({savedCount})</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

