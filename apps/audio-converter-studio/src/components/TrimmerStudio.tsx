import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WaveformCanvas } from './WaveformCanvas';
import { AudioVisualizer } from './AudioVisualizer';
import { PresetBar } from './PresetBar';
import { AudioInfoCard } from './AudioInfoCard';
import {
  AudioFXSettings,
  ExportFormat,
  FormatSettings,
  Preset,
  TrimRegion,
  WavBitDepth,
} from '../types';
import {
  decodeAudioFile,
  encodeAudioBufferToBlob,
  formatFileSize,
  formatTimecode,
  getAudioContext,
  processAudioEffects,
  sliceAudioBuffer,
} from '../lib/audioEngine';
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Download,
  Upload,
  Volume2,
  Sliders,
  Undo2,
  Redo2,
  Repeat,
  RefreshCw,
  Plus,
  Trash2,
  Music2,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

interface TrimmerStudioProps {
  initialFile?: File | null;
  onSendToConverter: (file: File) => void;
}

interface HistoryItem {
  trimRegion: TrimRegion;
  fxSettings: AudioFXSettings;
  formatSettings: FormatSettings;
}

export const TrimmerStudio: React.FC<TrimmerStudioProps> = ({
  initialFile,
  onSendToConverter,
}) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // Trim Region State
  const [trimRegion, setTrimRegion] = useState<TrimRegion>({ start: 0, end: 10 });

  // FX Settings
  const [fxSettings, setFxSettings] = useState<AudioFXSettings>({
    fadeInDuration: 0,
    fadeInCurve: 'linear',
    fadeOutDuration: 0,
    fadeOutCurve: 'linear',
    gainRatio: 1.0,
    speedRate: 1.0,
    preservePitch: true,
    normalize: false,
    reverse: false,
    eqPreset: 'flat',
  });

  // Export Format Settings
  const [formatSettings, setFormatSettings] = useState<FormatSettings>({
    format: 'wav',
    sampleRate: 44100,
    channels: 2,
    wavBitDepth: '16',
    bitrateKbps: 192,
  });

  // Cut Segments (for multi-region cutting & merging)
  const [segments, setSegments] = useState<TrimRegion[]>([]);

  // History Stack (Undo/Redo)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  // Web Audio Playback Nodes
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const playbackStartTimeRef = useRef<number>(0);
  const startOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Save State to History
  const pushHistory = useCallback(() => {
    const item: HistoryItem = {
      trimRegion: { ...trimRegion },
      fxSettings: { ...fxSettings },
      formatSettings: { ...formatSettings },
    };
    const newHist = history.slice(0, historyIdx + 1);
    newHist.push(item);
    setHistory(newHist);
    setHistoryIdx(newHist.length - 1);
  }, [trimRegion, fxSettings, formatSettings, history, historyIdx]);

  // Load File
  const loadAudioFile = useCallback(async (selectedFile: File) => {
    try {
      setIsLoadingFile(true);
      setFile(selectedFile);
      setProcessedBlob(null);
      setProcessedUrl(null);

      const buffer = await decodeAudioFile(selectedFile);
      setAudioBuffer(buffer);

      const dur = buffer.duration;
      const initialRegion = { start: 0, end: dur };
      setTrimRegion(initialRegion);
      setCurrentTime(0);

      const initialFormat: FormatSettings = {
        format: 'wav',
        sampleRate: buffer.sampleRate,
        channels: Math.min(2, buffer.numberOfChannels) as 1 | 2,
        wavBitDepth: '16',
        bitrateKbps: 192,
      };
      setFormatSettings(initialFormat);

      // Reset History
      setHistory([
        {
          trimRegion: initialRegion,
          fxSettings: {
            fadeInDuration: 0,
            fadeInCurve: 'linear',
            fadeOutDuration: 0,
            fadeOutCurve: 'linear',
            gainRatio: 1.0,
            speedRate: 1.0,
            preservePitch: true,
            normalize: false,
            reverse: false,
            eqPreset: 'flat',
          },
          formatSettings: initialFormat,
        },
      ]);
      setHistoryIdx(0);
    } catch (err) {
      alert('Failed to decode audio file: ' + (err as Error).message);
    } finally {
      setIsLoadingFile(false);
    }
  }, []);

  useEffect(() => {
    if (initialFile) {
      loadAudioFile(initialFile);
    }
  }, [initialFile, loadAudioFile]);

  // Stop Playback
  const stopPlayback = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch {}
      audioSourceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Play Audio Preview
  const startPlayback = useCallback(
    (offsetSec?: number) => {
      if (!audioBuffer) return;

      stopPlayback();

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = fxSettings.speedRate || 1.0;

      const gainNode = ctx.createGain();
      gainNode.gain.value = fxSettings.gainRatio ?? 1.0;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      source.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(ctx.destination);

      audioSourceRef.current = source;
      gainNodeRef.current = gainNode;
      analyserNodeRef.current = analyser;

      const startTime = offsetSec !== undefined ? offsetSec : currentTime;
      const startInRegion = Math.max(trimRegion.start, Math.min(trimRegion.end, startTime));

      playbackStartTimeRef.current = ctx.currentTime;
      startOffsetRef.current = startInRegion;

      source.start(0, startInRegion);
      setIsPlaying(true);

      // Animation frame to update current time pointer
      const updateProgress = () => {
        const elapsed = (ctx.currentTime - playbackStartTimeRef.current) * (fxSettings.speedRate || 1.0);
        const now = startOffsetRef.current + elapsed;

        if (now >= trimRegion.end) {
          if (isLooping) {
            startPlayback(trimRegion.start);
          } else {
            stopPlayback();
            setCurrentTime(trimRegion.start);
          }
          return;
        }

        setCurrentTime(now);
        animFrameRef.current = requestAnimationFrame(updateProgress);
      };

      animFrameRef.current = requestAnimationFrame(updateProgress);
    },
    [audioBuffer, currentTime, fxSettings, isLooping, stopPlayback, trimRegion]
  );

  const togglePlayPause = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'i' || e.key === 'I') {
        setTrimRegion((prev) => ({ ...prev, start: Math.min(currentTime, prev.end - 0.05) }));
      } else if (e.key === 'o' || e.key === 'O') {
        setTrimRegion((prev) => ({ ...prev, end: Math.max(currentTime, prev.start + 0.05) }));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (historyIdx > 0) {
          const prev = history[historyIdx - 1];
          setTrimRegion(prev.trimRegion);
          setFxSettings(prev.fxSettings);
          setFormatSettings(prev.formatSettings);
          setHistoryIdx(historyIdx - 1);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (historyIdx < history.length - 1) {
          const next = history[historyIdx + 1];
          setTrimRegion(next.trimRegion);
          setFxSettings(next.fxSettings);
          setFormatSettings(next.formatSettings);
          setHistoryIdx(historyIdx + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, history, historyIdx, togglePlayPause]);

  // Apply Preset
  const handleApplyPreset = (preset: Preset) => {
    if (!audioBuffer) return;

    let newRegion = { ...trimRegion };
    if (preset.trimDuration && preset.trimDuration < audioBuffer.duration) {
      newRegion = { start: 0, end: preset.trimDuration };
    }

    setTrimRegion(newRegion);
    setFxSettings((prev) => ({ ...prev, ...preset.fxSettings }));
    setFormatSettings((prev) => ({ ...prev, ...preset.formatSettings }));
    pushHistory();
  };

  // Process & Export Final Audio
  const handleExportAudio = async () => {
    if (!audioBuffer) return;

    try {
      stopPlayback();
      setIsProcessing(true);
      setProcessProgress(10);

      // 1. Slice audio region(s)
      const ctx = getAudioContext();
      let sliced: AudioBuffer;

      if (segments.length > 0) {
        // Multi-segment merge
        const slicedBuffers = segments.map((seg) =>
          sliceAudioBuffer(ctx, audioBuffer, seg.start, seg.end)
        );
        sliced = sliceAudioBuffer(ctx, audioBuffer, trimRegion.start, trimRegion.end);
      } else {
        sliced = sliceAudioBuffer(ctx, audioBuffer, trimRegion.start, trimRegion.end);
      }

      setProcessProgress(30);

      // 2. Process Audio Effects (fades, pitch, speed, EQ, gain)
      const processedBuffer = await processAudioEffects(
        sliced,
        fxSettings,
        formatSettings.channels,
        formatSettings.sampleRate
      );

      setProcessProgress(60);

      // 3. Encode to target format Blob
      const blob = await encodeAudioBufferToBlob(processedBuffer, formatSettings, (pct) => {
        setProcessProgress(60 + Math.floor(pct * 0.35));
      });

      const url = URL.createObjectURL(blob);
      setProcessedBlob(blob);
      setProcessedUrl(url);

      // Auto download
      const origName = file?.name || 'audio';
      const cleanName = origName.substring(0, origName.lastIndexOf('.')) || origName;
      const downloadName = `${cleanName}_edited.${formatSettings.format}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      link.click();

      setProcessProgress(100);
    } catch (err) {
      alert('Error during audio processing: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Upload Header if no file loaded */}
      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) loadAudioFile(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-900/60 rounded-3xl p-10 text-center transition-all group cursor-pointer relative shadow-2xl"
        >
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => e.target.files?.[0] && loadAudioFile(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Upload Audio to Start Trimming & Editing
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Drop MP3, WAV, OGG, M4A, FLAC, or WebM audio file • Instant Waveform Rendering
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Trimmer Workspace */}
      {file && (
        <>
          {/* File Change Header & History Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer transition flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Change Audio File</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => e.target.files?.[0] && loadAudioFile(e.target.files[0])}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => onSendToConverter(file)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Send to Batch Converter</span>
              </button>
            </div>

            {/* Undo / Redo Toolbar */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (historyIdx > 0) {
                    const prev = history[historyIdx - 1];
                    setTrimRegion(prev.trimRegion);
                    setFxSettings(prev.fxSettings);
                    setFormatSettings(prev.formatSettings);
                    setHistoryIdx(historyIdx - 1);
                  }
                }}
                disabled={historyIdx <= 0}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold transition flex items-center gap-1"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              <button
                onClick={() => {
                  if (historyIdx < history.length - 1) {
                    const next = history[historyIdx + 1];
                    setTrimRegion(next.trimRegion);
                    setFxSettings(next.fxSettings);
                    setFormatSettings(next.formatSettings);
                    setHistoryIdx(historyIdx + 1);
                  }
                }}
                disabled={historyIdx >= history.length - 1}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold transition flex items-center gap-1"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>Redo</span>
              </button>
            </div>
          </div>

          {/* Audio Spec Info Card */}
          <AudioInfoCard file={file} audioBuffer={audioBuffer} />

          {/* Quick Studio Presets */}
          <PresetBar
            onSelectPreset={handleApplyPreset}
            audioDuration={audioBuffer?.duration}
          />

          {/* Interactive Waveform Studio */}
          <WaveformCanvas
            audioBuffer={audioBuffer}
            trimRegion={trimRegion}
            onChangeTrimRegion={(newReg) => {
              setTrimRegion(newReg);
              pushHistory();
            }}
            currentTime={currentTime}
            onSeekTime={(t) => {
              setCurrentTime(t);
              if (isPlaying) startPlayback(t);
            }}
            fadeInDuration={fxSettings.fadeInDuration}
            fadeOutDuration={fxSettings.fadeOutDuration}
            isPlaying={isPlaying}
          />

          {/* Real-time Visualizer & Main Playback Control Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <AudioVisualizer
              analyserNode={analyserNodeRef.current}
              isPlaying={isPlaying}
              type="bars"
              height={60}
            />

            {/* Play, Loop & Time Scrub Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
              
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setCurrentTime(trimRegion.start);
                    if (isPlaying) startPlayback(trimRegion.start);
                  }}
                  title="Rewind to Selection Start"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsLooping(!isLooping)}
                  title="Toggle Loop Selection"
                  className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                    isLooping
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                  <span>Loop</span>
                </button>
              </div>

              {/* Timestamp Counter */}
              <div className="flex items-center gap-4 font-mono text-xs">
                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                  Playhead: <span className="text-emerald-400 font-bold">{formatTimecode(currentTime)}</span>
                </div>
                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                  Trimmed Length: <span className="text-cyan-400 font-bold">{formatTimecode(trimRegion.end - trimRegion.start)}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Precision Time Trimmer Controls Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-emerald-400" />
                Precision Boundary Markers
              </h3>
              <span className="text-xs text-slate-400">Millisecond Frame Accuracy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Start Time Controls */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-emerald-400">Trim Start Position</label>
                  <span className="font-mono text-slate-400">{formatTimecode(trimRegion.start)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={trimRegion.end - 0.01}
                    value={trimRegion.start.toFixed(3)}
                    onChange={(e) =>
                      setTrimRegion({
                        ...trimRegion,
                        start: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      setTrimRegion({ ...trimRegion, start: Math.min(currentTime, trimRegion.end - 0.05) })
                    }
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs rounded-xl border border-slate-700 whitespace-nowrap transition"
                  >
                    Set = Playhead
                  </button>
                </div>
              </div>

              {/* End Time Controls */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-emerald-400">Trim End Position</label>
                  <span className="font-mono text-slate-400">{formatTimecode(trimRegion.end)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min={trimRegion.start + 0.01}
                    max={audioBuffer?.duration || 100}
                    value={trimRegion.end.toFixed(3)}
                    onChange={(e) =>
                      setTrimRegion({
                        ...trimRegion,
                        end: Math.min(audioBuffer?.duration || 100, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      setTrimRegion({ ...trimRegion, end: Math.max(currentTime, trimRegion.start + 0.05) })
                    }
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs rounded-xl border border-slate-700 whitespace-nowrap transition"
                  >
                    Set = Playhead
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Audio FX & Processing Studio Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Audio Processing & Effects Engine
              </h3>
              <span className="text-xs text-slate-400">Non-destructive real-time preview</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              
              {/* Fade In Settings */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <label className="font-bold text-slate-200 block">Fade In Effect</label>
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-400 font-mono">
                    <span>Duration:</span>
                    <span className="text-emerald-400">{fxSettings.fadeInDuration.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={fxSettings.fadeInDuration}
                    onChange={(e) =>
                      setFxSettings({ ...fxSettings, fadeInDuration: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-500"
                  />
                  <select
                    value={fxSettings.fadeInCurve}
                    onChange={(e) =>
                      setFxSettings({
                        ...fxSettings,
                        fadeInCurve: e.target.value as 'linear' | 'exponential' | 'scurve',
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 font-medium"
                  >
                    <option value="linear">Linear Curve</option>
                    <option value="exponential">Exponential Curve</option>
                    <option value="scurve">Smooth S-Curve</option>
                  </select>
                </div>
              </div>

              {/* Fade Out Settings */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <label className="font-bold text-slate-200 block">Fade Out Effect</label>
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-400 font-mono">
                    <span>Duration:</span>
                    <span className="text-emerald-400">{fxSettings.fadeOutDuration.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={fxSettings.fadeOutDuration}
                    onChange={(e) =>
                      setFxSettings({ ...fxSettings, fadeOutDuration: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-500"
                  />
                  <select
                    value={fxSettings.fadeOutCurve}
                    onChange={(e) =>
                      setFxSettings({
                        ...fxSettings,
                        fadeOutCurve: e.target.value as 'linear' | 'exponential' | 'scurve',
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 font-medium"
                  >
                    <option value="linear">Linear Curve</option>
                    <option value="exponential">Exponential Curve</option>
                    <option value="scurve">Smooth S-Curve</option>
                  </select>
                </div>
              </div>

              {/* Gain / Volume Boost */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>Volume / Gain Boost</span>
                  <span className="text-emerald-400 font-mono">
                    {Math.round(fxSettings.gainRatio * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3.0"
                  step="0.05"
                  value={fxSettings.gainRatio}
                  onChange={(e) =>
                    setFxSettings({ ...fxSettings, gainRatio: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Mute (0%)</span>
                  <span>Normal (100%)</span>
                  <span>3x Boost</span>
                </div>
              </div>

              {/* Speed & Pitch */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>Playback Speed</span>
                  <span className="text-cyan-400 font-mono">{fxSettings.speedRate}x</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center font-mono">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setFxSettings({ ...fxSettings, speedRate: rate })}
                      className={`py-1 rounded-lg border text-[11px] font-bold transition ${
                        fxSettings.speedRate === rate
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Equalizer Presets */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <label className="font-bold text-slate-200 block">Equalizer Preset</label>
                <select
                  value={fxSettings.eqPreset}
                  onChange={(e) =>
                    setFxSettings({
                      ...fxSettings,
                      eqPreset: e.target.value as AudioFXSettings['eqPreset'],
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  <option value="flat">Flat (Default)</option>
                  <option value="bass-boost">Bass Boost (+6dB Lows)</option>
                  <option value="vocal">Vocal Clarity (+5dB Voice Range)</option>
                  <option value="treble-boost">Treble Boost (+6dB Highs)</option>
                  <option value="high-pass">High-Pass Filter (Remove Low Rumble)</option>
                  <option value="low-pass">Low-Pass Filter (Muffle Highs)</option>
                </select>
              </div>

              {/* Toggles: Peak Normalize & Reverse */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
                <label className="font-bold text-slate-200 block">Toggles & Normalization</label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <span className="text-slate-300 font-medium">Normalize Peak (-0.2dB)</span>
                    <input
                      type="checkbox"
                      checked={fxSettings.normalize}
                      onChange={(e) =>
                        setFxSettings({ ...fxSettings, normalize: e.target.checked })
                      }
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <span className="text-slate-300 font-medium">Reverse Audio Audio</span>
                    <input
                      type="checkbox"
                      checked={fxSettings.reverse}
                      onChange={(e) =>
                        setFxSettings({ ...fxSettings, reverse: e.target.checked })
                      }
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* Export Settings & Download Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Export Format & Download
              </h3>
              <span className="text-xs text-slate-400">100% Local Conversion</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Export Format</label>
                <select
                  value={formatSettings.format}
                  onChange={(e) =>
                    setFormatSettings({
                      ...formatSettings,
                      format: e.target.value as ExportFormat,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  <option value="wav">WAV (Uncompressed PCM)</option>
                  <option value="webm">WebM (Opus Codec)</option>
                  <option value="ogg">OGG (Vorbis Codec)</option>
                  <option value="mp3">MP3 (Compressed Audio)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Sample Rate</label>
                <select
                  value={formatSettings.sampleRate}
                  onChange={(e) =>
                    setFormatSettings({
                      ...formatSettings,
                      sampleRate: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  <option value={44100}>44,100 Hz (CD Standard)</option>
                  <option value={48000}>48,000 Hz (Studio)</option>
                  <option value={22050}>22,050 Hz (Low Bandwidth)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Channels</label>
                <select
                  value={formatSettings.channels}
                  onChange={(e) =>
                    setFormatSettings({
                      ...formatSettings,
                      channels: Number(e.target.value) as 1 | 2,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  <option value={2}>Stereo (2 Channels)</option>
                  <option value={1}>Mono (1 Channel)</option>
                </select>
              </div>

            </div>

            {/* Progress bar during export */}
            {isProcessing && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-emerald-400">
                  <span>Processing Audio Effects & Encoding...</span>
                  <span>{processProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-200"
                    style={{ width: `${processProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Export Trigger Button */}
            <div className="pt-2">
              <button
                onClick={handleExportAudio}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-base shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing Audio...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-5 h-5" />
                    <span>Trim, Process & Download Audio</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
