import React, { useState, useEffect } from 'react';
import { ImageFileRecord, ForensicFilter } from '../types';
import { processForensicAnalysis } from '../utils/visualForensics';
import { Eye, Sliders, Zap, RefreshCw, AlertCircle } from 'lucide-react';

interface VisualForensicsProps {
  currentRecord: ImageFileRecord;
}

export const VisualForensics: React.FC<VisualForensicsProps> = ({ currentRecord }) => {
  const [selectedFilter, setSelectedFilter] = useState<ForensicFilter>('ela');
  const [multiplier, setMultiplier] = useState<number>(15);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitPos, setSplitPos] = useState(50); // percentage for split view comparison

  useEffect(() => {
    let isMounted = true;
    const runAnalysis = async () => {
      setIsProcessing(true);
      try {
        const res = await processForensicAnalysis(
          currentRecord.previewUrl,
          selectedFilter,
          multiplier
        );
        if (isMounted) {
          setProcessedUrl(res);
        }
      } catch (err) {
        console.error('Forensics processing failed:', err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    runAnalysis();
    return () => {
      isMounted = false;
    };
  }, [currentRecord.previewUrl, selectedFilter, multiplier]);

  const filters: { id: ForensicFilter; label: string; desc: string }[] = [
    {
      id: 'ela',
      label: 'Error Level Analysis (ELA)',
      desc: 'Highlights JPEG re-compression delta. Edited or AI-inpainted areas show up as bright noise patches.',
    },
    {
      id: 'noise',
      label: 'High-Pass Noise Analysis',
      desc: 'Isolates high-frequency sensor noise pattern to detect spliced imagery or synthetic AI smoothing.',
    },
    {
      id: 'edges',
      label: 'Sobel Edge Isolation',
      desc: 'Detects sharp gradient transitions, halo borders, and compositing seams.',
    },
    {
      id: 'lsb-bitplane',
      label: 'LSB Bit-Plane Steganography',
      desc: 'Inspects Least Significant Bit planes to reveal hidden steganographic data streams or visual watermarks.',
    },
    {
      id: 'luminance',
      label: 'Luminance Gradient',
      desc: 'Converts to grayscale luminance map to inspect light consistency across elements.',
    },
    {
      id: 'channel-r',
      label: 'Red Channel Split',
      desc: 'Isolates red color channel wavelengths.',
    },
    {
      id: 'channel-g',
      label: 'Green Channel Split',
      desc: 'Isolates green color channel wavelengths.',
    },
    {
      id: 'channel-b',
      label: 'Blue Channel Split',
      desc: 'Isolates blue color channel wavelengths.',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-slate-100 text-base">Visual Forensics & ELA Inspection</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Detect hidden AI artifacts, digital manipulation, splice seams, or steganographic watermarks using client-side canvas shaders.
          </p>
        </div>

        {/* ELA Boost Sensitivity Control */}
        {selectedFilter === 'ela' && (
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center gap-3 shrink-0">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-300">ELA Gain ({multiplier}x):</span>
            <input
              type="range"
              min="5"
              max="40"
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="w-24 accent-sky-500 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Filter Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedFilter === f.id
                ? 'bg-sky-500/10 border-sky-500/50 text-sky-400 font-bold shadow-md shadow-sky-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span className="text-xs font-bold block">{f.label}</span>
            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-normal">{f.desc}</span>
          </button>
        ))}
      </div>

      {/* Interactive Canvas Viewport */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative overflow-hidden flex flex-col items-center">
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2 text-sky-400">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="text-xs font-bold text-slate-200">Processing Forensic Filter...</span>
          </div>
        )}

        <div className="relative max-w-full max-h-[500px] rounded-xl overflow-hidden border border-slate-800 select-none">
          {/* Base Filter Processed Image */}
          <img
            src={processedUrl || currentRecord.previewUrl}
            alt="Forensic View"
            className="max-h-[480px] object-contain block mx-auto"
          />

          {/* Split Slider Overlay for Original vs Processed */}
          <div
            className="absolute top-0 left-0 bottom-0 overflow-hidden border-r-2 border-sky-400 shadow-2xl"
            style={{ width: `${splitPos}%` }}
          >
            <img
              src={currentRecord.previewUrl}
              alt="Original View"
              className="max-h-[480px] object-contain block mx-auto pointer-events-none"
              style={{ width: '100%', maxWidth: 'none', height: '100%' }}
            />
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-bold text-slate-200 border border-slate-800">
              Original
            </span>
          </div>

          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-bold text-sky-400 border border-slate-800">
            {filters.find((f) => f.id === selectedFilter)?.label}
          </span>
        </div>

        {/* Split Comparison Slider */}
        <div className="w-full max-w-md mt-4 flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Original</span>
          <input
            type="range"
            min="0"
            max="100"
            value={splitPos}
            onChange={(e) => setSplitPos(Number(e.target.value))}
            className="flex-1 accent-sky-500 cursor-pointer"
          />
          <span className="text-xs font-semibold text-sky-400">Forensic Filter</span>
        </div>

        <div className="mt-4 p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-400 max-w-xl text-center">
          <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            {filters.find((f) => f.id === selectedFilter)?.desc}
          </span>
        </div>
      </div>
    </div>
  );
};
