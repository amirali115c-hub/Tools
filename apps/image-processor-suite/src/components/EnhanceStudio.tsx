import React, { useState } from 'react';
import { FilterSettings, ImageFileItem, OutputFormat, ProcessedResult } from '../types';
import { processEnhance } from '../utils/imageEngine';
import { Sliders, Sun, Contrast, Droplets, Eye, Type, RefreshCw, Zap, AlignCenter, RotateCcw } from 'lucide-react';

interface EnhanceStudioProps {
  item: ImageFileItem;
  onResult: (result: ProcessedResult) => void;
}

export const EnhanceStudio: React.FC<EnhanceStudioProps> = ({ item, onResult }) => {
  const [filters, setFilters] = useState<FilterSettings>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
    sharpen: false,
    grayscale: 0,
    sepia: 0,
    invert: false,
    watermarkText: '',
    watermarkColor: '#ffffff',
    watermarkOpacity: 80,
    watermarkPosition: 'bottom-right',
    watermarkFontSize: 32,
  });

  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/jpeg');
  const [quality, setQuality] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetFilters = () => {
    setFilters({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      blur: 0,
      sharpen: false,
      grayscale: 0,
      sepia: 0,
      invert: false,
      watermarkText: '',
      watermarkColor: '#ffffff',
      watermarkOpacity: 80,
      watermarkPosition: 'bottom-right',
      watermarkFontSize: 32,
    });
  };

  const handleApplyFilters = async () => {
    setIsProcessing(true);
    try {
      const res = await processEnhance(item, filters, outputFormat, quality);
      onResult(res);
    } catch (e) {
      console.error('Enhance failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Build live CSS filter string for preview
  const previewFilterParts: string[] = [];
  if (filters.brightness !== 0) previewFilterParts.push(`brightness(${100 + filters.brightness}%)`);
  if (filters.contrast !== 0) previewFilterParts.push(`contrast(${100 + filters.contrast}%)`);
  if (filters.saturation !== 0) previewFilterParts.push(`saturate(${100 + filters.saturation}%)`);
  if (filters.blur > 0) previewFilterParts.push(`blur(${filters.blur / 2}px)`);
  if (filters.grayscale > 0) previewFilterParts.push(`grayscale(${filters.grayscale}%)`);
  if (filters.sepia > 0) previewFilterParts.push(`sepia(${filters.sepia}%)`);
  if (filters.invert) previewFilterParts.push(`invert(100%)`);

  const previewCssFilter = previewFilterParts.join(' ');

  return (
    <div className="bg-white border border-[#E1E4EA] rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 text-[#1A1C1E]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1E4EA] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#1A1C1E] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#2D31FA]" />
            Filters & Watermark Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Adjust color contrast, brightness, blur effects, and apply copyright watermark text
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>

          <button
            onClick={handleApplyFilters}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2D31FA] hover:bg-[#2024d4] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-[#FF4D00]" />
                Apply & Export
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live CSS Preview Display */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative w-full aspect-[16/10] bg-[#121316] rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-2 shadow-xs">
            <img
              src={item.objectUrl}
              alt="Filter Preview"
              style={{ filter: previewCssFilter }}
              className="max-h-[460px] w-auto object-contain transition-[filter] duration-150"
            />

            {/* Live Watermark Overlay Mockup */}
            {filters.watermarkText && (
              <div
                className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between"
                style={{ opacity: filters.watermarkOpacity / 100 }}
              >
                <div
                  className={`flex w-full ${
                    filters.watermarkPosition.includes('right')
                      ? 'justify-end'
                      : filters.watermarkPosition === 'center'
                      ? 'justify-center my-auto'
                      : 'justify-start'
                  }`}
                >
                  <span
                    style={{
                      color: filters.watermarkColor,
                      fontSize: `${Math.max(12, filters.watermarkFontSize / 2.5)}px`,
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}
                    className="font-bold tracking-wide select-none"
                  >
                    {filters.watermarkText}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Adjustments & Watermark Sidebar */}
        <div className="space-y-5">
          {/* Color Adjustments */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#FF4D00]" />
              Color Adjustments
            </label>

            {/* Brightness */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Brightness</span>
                <span className="font-bold text-[#2D31FA]">{filters.brightness}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={filters.brightness}
                onChange={(e) => setFilters({ ...filters, brightness: parseInt(e.target.value) })}
                className="w-full accent-[#2D31FA] cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Contrast</span>
                <span className="font-bold text-[#2D31FA]">{filters.contrast}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={filters.contrast}
                onChange={(e) => setFilters({ ...filters, contrast: parseInt(e.target.value) })}
                className="w-full accent-[#2D31FA] cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Saturation</span>
                <span className="font-bold text-[#2D31FA]">{filters.saturation}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={filters.saturation}
                onChange={(e) => setFilters({ ...filters, saturation: parseInt(e.target.value) })}
                className="w-full accent-[#2D31FA] cursor-pointer"
              />
            </div>

            {/* Blur */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Blur Effect</span>
                <span className="font-bold text-[#2D31FA]">{filters.blur} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={filters.blur}
                onChange={(e) => setFilters({ ...filters, blur: parseInt(e.target.value) })}
                className="w-full accent-[#2D31FA] cursor-pointer"
              />
            </div>

            {/* Grayscale */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Grayscale (B&W)</span>
                <span className="font-bold text-[#2D31FA]">{filters.grayscale}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.grayscale}
                onChange={(e) => setFilters({ ...filters, grayscale: parseInt(e.target.value) })}
                className="w-full accent-[#2D31FA] cursor-pointer"
              />
            </div>

            {/* Invert */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-700 font-semibold">Invert Colors</span>
              <input
                type="checkbox"
                checked={filters.invert}
                onChange={(e) => setFilters({ ...filters, invert: e.target.checked })}
                className="rounded bg-white border-slate-300 text-[#2D31FA] focus:ring-[#2D31FA]"
              />
            </div>
          </div>

          {/* Watermark Section */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Type className="w-4 h-4 text-[#2D31FA]" />
              Watermark Text Overlay
            </label>

            <div>
              <input
                type="text"
                placeholder="e.g. © 2026 Your Brand"
                value={filters.watermarkText}
                onChange={(e) => setFilters({ ...filters, watermarkText: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#1A1C1E] focus:outline-none focus:border-[#2D31FA]"
              />
            </div>

            {filters.watermarkText && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Text Color</span>
                    <input
                      type="color"
                      value={filters.watermarkColor}
                      onChange={(e) => setFilters({ ...filters, watermarkColor: e.target.value })}
                      className="w-full h-8 mt-1 bg-white border border-slate-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Font Size (px)</span>
                    <input
                      type="number"
                      min="12"
                      max="120"
                      value={filters.watermarkFontSize}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          watermarkFontSize: Math.max(8, parseInt(e.target.value) || 24),
                        })
                      }
                      className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-[#1A1C1E]"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-medium">Position</span>
                  <select
                    value={filters.watermarkPosition}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        watermarkPosition: e.target.value as any,
                      })
                    }
                    className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-[#1A1C1E]"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="center">Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="tile">Tile Grid Overlay</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
