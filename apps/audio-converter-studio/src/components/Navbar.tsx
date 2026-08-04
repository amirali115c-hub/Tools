import React from 'react';
import { AppMode } from '../types';
import { Scissors, RefreshCw, Mic, ShieldCheck, Keyboard, Sparkles, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onOpenShortcuts: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  onOpenShortcuts,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Scissors className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                SoundForge <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Studio</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Audio Converter & Trimmer • 100% Client Rendering</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <button
            onClick={() => onSelectMode('trimmer')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              currentMode === 'trimmer'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Audio Trimmer</span>
          </button>

          <button
            onClick={() => onSelectMode('converter')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              currentMode === 'converter'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Batch Converter</span>
          </button>

          <button
            onClick={() => onSelectMode('recorder')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              currentMode === 'recorder'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span className="hidden md:inline">Voice Recorder</span>
            <span className="md:hidden">Record</span>
          </button>
        </nav>

        {/* Action controls & Privacy badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium">100% In-Browser Privacy</span>
          </div>

          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg transition"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleDarkMode}
            title="Toggle theme"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg transition"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
};
