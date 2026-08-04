import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TrimmerStudio } from './components/TrimmerStudio';
import { ConverterStudio } from './components/ConverterStudio';
import { AudioRecorder } from './components/AudioRecorder';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AppMode, AudioFileItem } from './types';
import { ShieldCheck, Sparkles, Zap, Heart, Disc, Music } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('trimmer');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'trimmer' || mode === 'converter' || mode === 'recorder') {
      setCurrentMode(mode);
    }
  }, []);

  // Shared state across studio modes
  const [trimmerFile, setTrimmerFile] = useState<File | null>(null);
  const [converterFiles, setConverterFiles] = useState<AudioFileItem[]>([]);

  // Add files to Converter Queue
  const handleAddConverterFiles = (newFiles: File[]) => {
    const items: AudioFileItem[] = newFiles.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      duration: 0,
      sampleRate: 44100,
      numberOfChannels: 2,
      status: 'idle',
    }));

    setConverterFiles((prev) => [...prev, ...items]);
  };

  const handleRemoveConverterFile = (id: string) => {
    setConverterFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearConverterFiles = () => {
    setConverterFiles([]);
  };

  // Switch to Trimmer with specific file
  const handleSendToTrimmer = (file: File) => {
    setTrimmerFile(file);
    setCurrentMode('trimmer');
  };

  // Switch to Converter with specific file
  const handleSendToConverter = (file: File) => {
    handleAddConverterFiles([file]);
    setCurrentMode('converter');
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans selection:bg-emerald-500 selection:text-white ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Navigation Header */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Studio Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Mode Title Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero Server Upload • Pure Web Audio Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {currentMode === 'trimmer' && 'High-Precision Audio Trimmer Studio'}
            {currentMode === 'converter' && 'Batch Audio Converter & Encoder'}
            {currentMode === 'recorder' && 'Studio Voice & Microphone Recorder'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            {currentMode === 'trimmer' &&
              'Cut, slice, apply fades, boost gain, adjust speed & pitch, normalize and export audio files instantly.'}
            {currentMode === 'converter' &&
              'Convert WAV, MP3, WebM, OGG, M4A, FLAC, AAC in batch with custom sample rates and zip archive downloads.'}
            {currentMode === 'recorder' &&
              'Record studio-grade microphone audio with real-time spectrum visualizer and load directly into the editor.'}
          </p>
        </div>

        {/* Dynamic Studio Workspace */}
        {currentMode === 'trimmer' && (
          <TrimmerStudio
            initialFile={trimmerFile}
            onSendToConverter={handleSendToConverter}
          />
        )}

        {currentMode === 'converter' && (
          <ConverterStudio
            files={converterFiles}
            onAddFiles={handleAddConverterFiles}
            onRemoveFile={handleRemoveConverterFile}
            onClearFiles={handleClearConverterFiles}
            onSendFileToTrimmer={handleSendToTrimmer}
          />
        )}

        {currentMode === 'recorder' && (
          <AudioRecorder
            onSendToTrimmer={handleSendToTrimmer}
            onSendToConverter={handleSendToConverter}
          />
        )}

        {/* Feature Highlights Grid */}
        <section className="pt-12 border-t border-slate-800/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">100% In-Browser Privacy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your audio files never leave your computer. All trimming, fading, and encoding execute locally using Web Audio API & WebAssembly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Millisecond Precision</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual zoomable waveform studio with live playhead scrubbing, custom fade curves, volume boost, and frame-accurate boundary setting.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Disc className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Batch & ZIP Processing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Batch convert dozens of audio files simultaneously. Customize sample rate, channel count, and download all converted files in one ZIP archive.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-16 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>SoundForge Studio • Free, Unlimited & Client-Side</span>
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>WAV PCM (16/24/32-bit)</span>
            <span>•</span>
            <span>WebM Opus</span>
            <span>•</span>
            <span>OGG Vorbis</span>
            <span>•</span>
            <span>MP3</span>
          </div>
        </div>
      </footer>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}
