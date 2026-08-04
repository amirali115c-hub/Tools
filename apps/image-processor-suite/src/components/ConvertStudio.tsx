import React, { useState } from 'react';
import { ConversionSettings, ImageFileItem, OutputFormat, ProcessedResult } from '../types';
import { processConvert } from '../utils/imageEngine';
import { RefreshCw, Lock, Unlock, Zap, Check, FileType, Sliders } from 'lucide-react';

interface ConvertStudioProps {
  item: ImageFileItem;
  onResult: (result: ProcessedResult) => void;
}

export const ConvertStudio: React.FC<ConvertStudioProps> = ({ item, onResult }) => {
  const [settings, setSettings] = useState<ConversionSettings>({
    outputFormat: 'image/webp',
    quality: 85,
    enableResize: false,
    resizeWidth: item.width,
    resizeHeight: item.height,
    scalePercent: 100,
    lockAspectRatio: true,
    transparentBackground: true,
    stripMetadata: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const formats: { id: OutputFormat; ext: string; name: string; desc: string; badge: string }[] = [
    {
      id: 'image/webp',
      ext: '.webp',
      name: 'WebP',
      desc: '25-35% smaller than JPG/PNG with equal visual clarity',
      badge: 'Best for Web',
    },
    {
      id: 'image/png',
      ext: '.png',
      name: 'PNG',
      desc: 'Lossless quality with transparent background support',
      badge: 'Transparent',
    },
    {
      id: 'image/jpeg',
      ext: '.jpg',
      name: 'JPEG',
      desc: 'Universal format supported across all hardware and platforms',
      badge: 'Universal',
    },
    {
      id: 'image/avif',
      ext: '.avif',
      name: 'AVIF',
      desc: 'Next-gen image format with ultra compression capabilities',
      badge: 'Next-Gen',
    },
    {
      id: 'image/gif',
      ext: '.gif',
      name: 'GIF',
      desc: 'Standard raster format',
      badge: 'Standard',
    },
    {
      id: 'image/bmp',
      ext: '.bmp',
      name: 'BMP',
      desc: 'Uncompressed raw bitmap graphic',
      badge: 'Bitmap',
    },
  ];

  const handleWidthChange = (val: number) => {
    let w = Math.max(1, val);
    let h = settings.resizeHeight;
    if (settings.lockAspectRatio && item.aspectRatio) {
      h = Math.round(w / item.aspectRatio);
    }
    setSettings({ ...settings, resizeWidth: w, resizeHeight: h });
  };

  const handleHeightChange = (val: number) => {
    let h = Math.max(1, val);
    let w = settings.resizeWidth;
    if (settings.lockAspectRatio && item.aspectRatio) {
      w = Math.round(h * item.aspectRatio);
    }
    setSettings({ ...settings, resizeHeight: h, resizeWidth: w });
  };

  const handleScalePercentChange = (pct: number) => {
    const factor = pct / 100;
    const w = Math.round(item.width * factor);
    const h = Math.round(item.height * factor);
    setSettings({
      ...settings,
      scalePercent: pct,
      resizeWidth: w,
      resizeHeight: h,
    });
  };

  const handleConvert = async () => {
    setIsProcessing(true);
    try {
      const res = await processConvert(item, settings);
      onResult(res);
    } catch (e) {
      console.error('Conversion failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-[#E1E4EA] rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 text-[#1A1C1E]">
      <div className="flex items-center justify-between border-b border-[#E1E4EA] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#1A1C1E] flex items-center gap-2">
            <FileType className="w-5 h-5 text-[#2D31FA]" />
            Image Format Converter
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Convert seamlessly between PNG, JPG, WebP, AVIF, GIF, and BMP
          </p>
        </div>

        <button
          onClick={handleConvert}
          disabled={isProcessing}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2D31FA] hover:bg-[#2024d4] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-[#FF4D00]" />
              Convert Format
            </>
          )}
        </button>
      </div>

      {/* Format Selection Grid */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Select Target Format
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {formats.map((fmt) => {
            const isSelected = settings.outputFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setSettings({ ...settings, outputFormat: fmt.id })}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#2D31FA]/5 border-[#2D31FA] text-[#2D31FA] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1A1C1E]">{fmt.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 border border-slate-300 text-slate-800 font-mono font-semibold">
                      {fmt.ext}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{fmt.desc}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#2D31FA]">{fmt.badge}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#2D31FA]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality Control Slider */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700">Compression Quality</span>
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
        <div className="flex gap-1.5 pt-1">
          {[50, 70, 85, 95, 100].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setSettings({ ...settings, quality: q })}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                settings.quality === q
                  ? 'bg-[#2D31FA] text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {q}%
            </button>
          ))}
        </div>
      </div>

      {/* Optional Resizing Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enableResize}
              onChange={(e) => setSettings({ ...settings, enableResize: e.target.checked })}
              className="rounded bg-white border-slate-300 text-[#2D31FA] focus:ring-[#2D31FA]"
            />
            Enable Custom Resizing
          </label>
        </div>

        {settings.enableResize && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Width (px)</label>
                <input
                  type="number"
                  value={settings.resizeWidth}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#1A1C1E]"
                />
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setSettings({ ...settings, lockAspectRatio: !settings.lockAspectRatio })
                  }
                  className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                    settings.lockAspectRatio
                      ? 'bg-[#2D31FA]/10 border-[#2D31FA] text-[#2D31FA]'
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}
                  title="Toggle Aspect Ratio Lock"
                >
                  {settings.lockAspectRatio ? (
                    <Lock className="w-3.5 h-3.5 text-[#2D31FA]" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{settings.lockAspectRatio ? 'Locked' : 'Unlocked'}</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold">Height (px)</label>
                <input
                  type="number"
                  value={settings.resizeHeight}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#1A1C1E]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-1">
                <span>Scale Percentage</span>
                <span className="font-bold text-[#2D31FA]">{settings.scalePercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={settings.scalePercent}
                onChange={(e) => handleScalePercentChange(parseInt(e.target.value))}
                className="w-full accent-[#2D31FA] cursor-pointer"
              />
            </div>

            {/* Quick Resolution Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-500 font-medium self-center">Presets:</span>
              {[
                { label: '1080p Full HD', w: 1920, h: 1080 },
                { label: '720p HD', w: 1280, h: 720 },
                { label: 'VGA 640x480', w: 640, h: 480 },
                { label: 'Avatar 400x400', w: 400, h: 400 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      enableResize: true,
                      resizeWidth: p.w,
                      resizeHeight: p.h,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transparency Control */}
      {settings.outputFormat !== 'image/jpeg' && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="transparentBg"
            checked={settings.transparentBackground}
            onChange={(e) =>
              setSettings({ ...settings, transparentBackground: e.target.checked })
            }
            className="rounded bg-white border-slate-300 text-[#2D31FA] focus:ring-[#2D31FA]"
          />
          <label htmlFor="transparentBg" className="text-xs text-slate-700 font-semibold">
            Preserve Alpha Transparency (Clear background)
          </label>
        </div>
      )}
    </div>
  );
};
