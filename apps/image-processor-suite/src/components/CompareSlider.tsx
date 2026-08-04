import React, { useState, useRef, useEffect } from 'react';
import { ProcessedResult, ImageFileItem } from '../types';
import { formatBytes } from '../utils/imageEngine';
import { Maximize2, Split, ArrowLeftRight, Download, CheckCircle2, TrendingDown } from 'lucide-react';

interface CompareSliderProps {
  original: ImageFileItem;
  result?: ProcessedResult;
  onDownload?: () => void;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  original,
  result,
  onDownload,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side'>('split');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const resultUrl = result ? result.objectUrl : original.objectUrl;

  return (
    <div className="bg-white border border-[#E1E4EA] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 text-[#1A1C1E]">
      {/* Top Controls & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1E4EA] pb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#1A1C1E] flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-[#2D31FA]" />
            Comparison View
          </span>
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex gap-1">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                viewMode === 'split'
                  ? 'bg-[#2D31FA] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Split Slider
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                viewMode === 'side-by-side'
                  ? 'bg-[#2D31FA] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side
            </button>
          </div>
        </div>

        {result && (
          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                Download Result
              </button>
            )}
          </div>
        )}
      </div>

      {/* Statistics Banner */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div>
            <p className="text-slate-500 font-medium">Original Size</p>
            <p className="text-sm font-bold text-[#1A1C1E] mt-0.5">
              {formatBytes(original.originalSize)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Compressed Size</p>
            <p className="text-sm font-bold text-emerald-700 mt-0.5">
              {formatBytes(result.compressedSize)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Saved</p>
            <p className="text-sm font-bold text-[#2D31FA] mt-0.5 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-[#2D31FA]" />
              {result.savedPercent}% ({formatBytes(Math.abs(result.savedBytes))})
            </p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Dimensions</p>
            <p className="text-sm font-bold text-[#1A1C1E] mt-0.5">
              {result.width} × {result.height} px
            </p>
          </div>
        </div>
      )}

      {/* Main Image Viewer */}
      {viewMode === 'split' ? (
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchMove={handleTouchMove}
          className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[500px] rounded-2xl overflow-hidden bg-[#121316] border border-slate-800 select-none cursor-col-resize group shadow-xs"
        >
          {/* Original Image (Background) */}
          <img
            src={original.objectUrl}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Processed Image (Clipped Overlay) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={resultUrl}
              alt="Processed"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
          </div>

          {/* Slider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white text-slate-900 rounded-full shadow-lg flex items-center justify-center font-bold text-xs pointer-events-auto cursor-col-resize hover:scale-110 transition-transform">
              <Split className="w-4 h-4 text-slate-900" />
            </div>
          </div>

          {/* Labels */}
          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-red-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-red-200 z-10 shadow-xs">
            Original
          </span>
          <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-emerald-200 z-10 shadow-xs">
            Processed
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative aspect-[16/10] bg-[#121316] rounded-2xl border border-slate-800 overflow-hidden p-2">
            <span className="absolute top-3 left-3 bg-white/95 text-red-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-red-200 z-10 shadow-xs">
              Before ({formatBytes(original.originalSize)})
            </span>
            <img
              src={original.objectUrl}
              alt="Original"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="relative aspect-[16/10] bg-[#121316] rounded-2xl border border-slate-800 overflow-hidden p-2">
            <span className="absolute top-3 left-3 bg-white/95 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-emerald-200 z-10 shadow-xs">
              After {result ? `(${formatBytes(result.compressedSize)})` : ''}
            </span>
            <img
              src={resultUrl}
              alt="Processed"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
