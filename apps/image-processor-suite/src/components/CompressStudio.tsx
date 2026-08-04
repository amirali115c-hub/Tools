import React, { useState } from 'react';
import { CompressionSettings, ImageFileItem, ProcessedResult } from '../types';
import { processCompress } from '../utils/imageEngine';
import { Minimize2, Target, Zap, Settings2, Sliders, Check, RefreshCw } from 'lucide-react';

interface CompressStudioProps {
  item: ImageFileItem;
  onResult: (result: ProcessedResult) => void;
}

export const CompressStudio: React.FC<CompressStudioProps> = ({ item, onResult }) => {
  const [settings, setSettings] = useState<CompressionSettings>({
    mode: 'quality',
    quality: 80,
    targetSizeValue: 200,
    targetSizeUnit: 'KB',
    outputFormat: 'auto',
    maxWidth: 0,
    maxHeight: 0,
    stripMeta: true,
    maintainAspectRatio: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const handleCompress = async () => {
    setIsProcessing(true);
    try {
      const res = await processCompress(item, settings);
      onResult(res);
    } catch (e) {
      console.error('Compression failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-[#E1E4EA] rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 text-[#1A1C1E]">
      <div className="flex items-center justify-between border-b border-[#E1E4EA] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#1A1C1E] flex items-center gap-2">
            <Minimize2 className="w-5 h-5 text-[#2D31FA]" />
            Image Compressor
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Reduce file size up to 90% without visible quality loss
          </p>
        </div>

        <button
          onClick={handleCompress}
          disabled={isProcessing}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2D31FA] hover:bg-[#2024d4] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Compressing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-[#FF4D00]" />
              Compress Image
            </>
          )}
        </button>
      </div>

      {/* Compression Mode Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Compression Strategy
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSettings({ ...settings, mode: 'quality' })}
            className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
              settings.mode === 'quality'
                ? 'bg-[#2D31FA]/5 border-[#2D31FA] text-[#2D31FA] font-medium'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-5 h-5 text-[#2D31FA] mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#1A1C1E]">Quality Slider</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Set quality percentage from 10% to 100%
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSettings({ ...settings, mode: 'target' })}
            className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
              settings.mode === 'target'
                ? 'bg-[#2D31FA]/5 border-[#2D31FA] text-[#2D31FA] font-medium'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Target className="w-5 h-5 text-[#2D31FA] mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#1A1C1E]">Target Size</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Binary search quality to hit exact KB target
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSettings({ ...settings, mode: 'auto' })}
            className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
              settings.mode === 'auto'
                ? 'bg-[#2D31FA]/5 border-[#2D31FA] text-[#2D31FA] font-medium'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-5 h-5 text-[#FF4D00] mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#1A1C1E]">Auto Optimize</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Convert to WebP with smart web compression
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Mode Controls */}
      {settings.mode === 'quality' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">Quality Percentage</span>
            <span className="font-bold text-[#2D31FA] text-sm">{settings.quality}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={settings.quality}
            onChange={(e) => setSettings({ ...settings, quality: parseInt(e.target.value) })}
            className="w-full accent-[#2D31FA] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Smaller File (10%)</span>
            <span>Balanced (80%)</span>
            <span>Max Quality (100%)</span>
          </div>
        </div>
      )}

      {settings.mode === 'target' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <label className="text-xs font-semibold text-slate-700">Target Maximum File Size</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="10"
              max="50000"
              value={settings.targetSizeValue}
              onChange={(e) =>
                setSettings({ ...settings, targetSizeValue: Math.max(1, parseInt(e.target.value) || 100) })
              }
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#1A1C1E] focus:outline-none focus:border-[#2D31FA]"
              placeholder="Target Size"
            />
            <select
              value={settings.targetSizeUnit}
              onChange={(e) =>
                setSettings({ ...settings, targetSizeUnit: e.target.value as 'KB' | 'MB' })
              }
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#1A1C1E] focus:outline-none focus:border-[#2D31FA]"
            >
              <option value="KB">KB</option>
              <option value="MB">MB</option>
            </select>
          </div>
          <p className="text-[11px] text-slate-500">
            Our engine runs client-side binary search iterations on Canvas quality to stay strictly under your target limit.
          </p>
        </div>
      )}

      {/* Output Format Badges */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Output Format
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'auto', label: 'Auto (Original Format)' },
            { id: 'image/webp', label: 'WebP (Recommended)' },
            { id: 'image/jpeg', label: 'JPEG' },
            { id: 'image/png', label: 'PNG' },
          ].map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setSettings({ ...settings, outputFormat: fmt.id as any })}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                settings.outputFormat === fmt.id
                  ? 'bg-[#2D31FA] border-[#2D31FA] text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resizing Options */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Dimension Downscaling (Optional)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Max Width (px)</span>
            <input
              type="number"
              placeholder={`Original: ${item.width} px`}
              value={settings.maxWidth || ''}
              onChange={(e) =>
                setSettings({ ...settings, maxWidth: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-[#1A1C1E] focus:outline-none focus:border-[#2D31FA]"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Max Height (px)</span>
            <input
              type="number"
              placeholder={`Original: ${item.height} px`}
              value={settings.maxHeight || ''}
              onChange={(e) =>
                setSettings({ ...settings, maxHeight: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-[#1A1C1E] focus:outline-none focus:border-[#2D31FA]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
