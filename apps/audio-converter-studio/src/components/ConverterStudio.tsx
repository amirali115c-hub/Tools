import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  AudioFileItem,
  ExportFormat,
  FormatSettings,
  WavBitDepth,
} from '../types';
import {
  decodeAudioFile,
  encodeAudioBufferToBlob,
  formatFileSize,
  formatTimecode,
  processAudioEffects,
} from '../lib/audioEngine';
import {
  UploadCloud,
  FileAudio,
  Download,
  Trash2,
  Settings2,
  RefreshCw,
  Archive,
  CheckCircle2,
  AlertCircle,
  Scissors,
} from 'lucide-react';

interface ConverterStudioProps {
  files: AudioFileItem[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onSendFileToTrimmer: (file: File) => void;
}

export const ConverterStudio: React.FC<ConverterStudioProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onSendFileToTrimmer,
}) => {
  // Global settings state
  const [globalSettings, setGlobalSettings] = useState<FormatSettings>({
    format: 'wav',
    sampleRate: 44100,
    channels: 2,
    wavBitDepth: '16',
    bitrateKbps: 192,
  });

  const [isConvertingAll, setIsConvertingAll] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [items, setItems] = useState<AudioFileItem[]>(files);

  // Sync prop changes
  React.useEffect(() => {
    setItems(files);
  }, [files]);

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const audioFiles = Array.from(e.dataTransfer.files).filter((f: File) =>
        f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|wma|webm|aiff)$/i.test(f.name)
      );
      if (audioFiles.length > 0) {
        onAddFiles(audioFiles);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
    }
  };

  // Convert a single item
  const convertSingleItem = async (item: AudioFileItem) => {
    const updated = items.map((i) => (i.id === item.id ? { ...i, status: 'processing' as const } : i));
    setItems(updated);

    try {
      let buffer = item.audioBuffer;
      if (!buffer) {
        buffer = await decodeAudioFile(item.file);
      }

      // Apply channel downmix or sample rate resample if needed
      const processedBuffer = await processAudioEffects(
        buffer,
        {
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
        globalSettings.channels,
        globalSettings.sampleRate
      );

      const blob = await encodeAudioBufferToBlob(processedBuffer, globalSettings);
      const outputUrl = URL.createObjectURL(blob);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                audioBuffer: buffer,
                status: 'done',
                outputBlob: blob,
                outputUrl: outputUrl,
                outputSize: blob.size,
                outputFormat: globalSettings.format,
              }
            : i
        )
      );
    } catch (err) {
      console.error('Conversion error:', err);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'error', errorMessage: (err as Error).message }
            : i
        )
      );
    }
  };

  // Convert all items in batch
  const handleConvertAll = async () => {
    if (items.length === 0) return;
    setIsConvertingAll(true);
    setBatchProgress(0);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await convertSingleItem(item);
      setBatchProgress(Math.round(((i + 1) / items.length) * 100));
    }

    setIsConvertingAll(false);
  };

  // Download ZIP of all converted files
  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const doneItems = items.filter((i) => i.status === 'done' && i.outputBlob);

    if (doneItems.length === 0) return;

    doneItems.forEach((item) => {
      const ext = item.outputFormat || 'wav';
      const cleanName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
      const fileName = `${cleanName}_converted.${ext}`;
      zip.file(fileName, item.outputBlob!);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `converted_audio_batch_${Date.now()}.zip`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Banner / Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-900/60 rounded-3xl p-8 text-center transition-all group cursor-pointer relative overflow-hidden shadow-xl"
      >
        <input
          type="file"
          multiple
          accept="audio/*"
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <p className="text-base font-bold text-white">
              Drag & Drop Audio Files Here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports MP3, WAV, OGG, M4A, FLAC, AAC, WebM, WMA, AIFF • Convert in Batch 100% Client-Side
            </p>
          </div>
          <button className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition pointer-events-none">
            Browse Audio Files
          </button>
        </div>
      </div>

      {/* Global Conversion Settings Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Settings2 className="w-4 h-4 text-emerald-400" />
            <span>Output Format & Processing Configuration</span>
          </div>
          <span className="text-xs text-slate-400">Applies to all batch files</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* Format Select */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Target Format</label>
            <select
              value={globalSettings.format}
              onChange={(e) =>
                setGlobalSettings({ ...globalSettings, format: e.target.value as ExportFormat })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
            >
              <option value="wav">WAV (Uncompressed PCM)</option>
              <option value="webm">WebM (Opus Codec)</option>
              <option value="ogg">OGG (Vorbis Codec)</option>
              <option value="mp3">MP3 (Compressed Audio)</option>
            </select>
          </div>

          {/* Sample Rate Select */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Sample Rate</label>
            <select
              value={globalSettings.sampleRate}
              onChange={(e) =>
                setGlobalSettings({ ...globalSettings, sampleRate: Number(e.target.value) })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
            >
              <option value={44100}>44,100 Hz (CD Standard)</option>
              <option value={48000}>48,000 Hz (Studio / Video)</option>
              <option value={96000}>96,000 Hz (Hi-Res Audio)</option>
              <option value={22050}>22,050 Hz (Low Bandwidth)</option>
              <option value={11025}>11,025 Hz (Voice Compression)</option>
            </select>
          </div>

          {/* Channels Select */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Channels</label>
            <select
              value={globalSettings.channels}
              onChange={(e) =>
                setGlobalSettings({
                  ...globalSettings,
                  channels: Number(e.target.value) as 1 | 2,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
            >
              <option value={2}>2 Channels (Stereo)</option>
              <option value={1}>1 Channel (Mono)</option>
            </select>
          </div>

          {/* Specific Bit Depth / Bitrate */}
          {globalSettings.format === 'wav' ? (
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">WAV Bit Depth</label>
              <select
                value={globalSettings.wavBitDepth}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    wavBitDepth: e.target.value as WavBitDepth,
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
              >
                <option value="16">16-bit Int (Standard)</option>
                <option value="24">24-bit Int (Studio)</option>
                <option value="32float">32-bit Float (Pro)</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Target Bitrate</label>
              <select
                value={globalSettings.bitrateKbps}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    bitrateKbps: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:border-emerald-500 focus:outline-none"
              >
                <option value={320}>320 kbps (Extreme Quality)</option>
                <option value={256}>256 kbps (High Quality)</option>
                <option value={192}>192 kbps (Medium Quality)</option>
                <option value={128}>128 kbps (Standard Web)</option>
                <option value={64}>64 kbps (Voice Compact)</option>
              </select>
            </div>
          )}

        </div>
      </div>

      {/* Batch Actions Bar */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white">
              Files Queue ({items.length})
            </span>
            <button
              onClick={onClearFiles}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Queue</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConvertAll}
              disabled={isConvertingAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isConvertingAll ? 'animate-spin' : ''}`} />
              <span>{isConvertingAll ? 'Converting Batch...' : 'Convert All Files'}</span>
            </button>

            {items.some((i) => i.status === 'done') && (
              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition"
              >
                <Archive className="w-4 h-4" />
                <span>Download All (.ZIP)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* File List Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const cleanName = item.name;
          const outputExt = globalSettings.format;

          return (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3.5 w-full md:w-auto">
                <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 border border-slate-800">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-white truncate max-w-xs md:max-w-md">
                    {cleanName}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                    <span>Input: {formatFileSize(item.size)}</span>
                    {item.outputSize && (
                      <span className="text-emerald-400">
                        → Output: {formatFileSize(item.outputSize)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                {item.status === 'idle' && (
                  <span className="text-xs text-slate-400 font-medium">Ready</span>
                )}

                {item.status === 'processing' && (
                  <span className="text-xs text-teal-400 font-medium flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Converting...
                  </span>
                )}

                {item.status === 'done' && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Converted
                  </span>
                )}

                {item.status === 'error' && (
                  <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Failed
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSendFileToTrimmer(item.file)}
                    title="Send to Audio Trimmer"
                    className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 transition text-xs font-semibold flex items-center gap-1"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Trim</span>
                  </button>

                  {item.status === 'done' && item.outputUrl && (
                    <a
                      href={item.outputUrl}
                      download={`${cleanName.replace(/\.[^.]+$/, '')}_converted.${outputExt}`}
                      className="p-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 transition text-xs font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}

                  {item.status !== 'processing' && (
                    <button
                      onClick={() => convertSingleItem(item)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition text-xs font-semibold"
                    >
                      Convert
                    </button>
                  )}

                  <button
                    onClick={() => onRemoveFile(item.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
