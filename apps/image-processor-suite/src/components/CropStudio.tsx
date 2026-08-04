import React, { useState, useRef, useEffect } from 'react';
import { CropSettings, ImageFileItem, ProcessedResult, SocialPreset } from '../types';
import { processCrop } from '../utils/imageEngine';
import {
  Crop,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Circle,
  Square,
  Undo2,
  Redo2,
  RefreshCw,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';

interface CropStudioProps {
  item: ImageFileItem;
  onResult: (result: ProcessedResult) => void;
}

export const CropStudio: React.FC<CropStudioProps> = ({ item, onResult }) => {
  const [cropSettings, setCropSettings] = useState<CropSettings>({
    aspectRatio: 0, // Free
    cropX: 0,
    cropY: 0,
    cropWidth: item.width,
    cropHeight: item.height,
    rotation: 0,
    flipX: false,
    flipY: false,
    roundCrop: false,
    zoom: 100,
    outputFormat: 'image/png',
    quality: 92,
  });

  const [history, setHistory] = useState<CropSettings[]>([]);
  const [redoStack, setRedoStack] = useState<CropSettings[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; cropX: number; cropY: number; cropW: number; cropH: number }>({
    x: 0,
    y: 0,
    cropX: 0,
    cropY: 0,
    cropW: item.width,
    cropH: item.height,
  });

  const saveHistory = (newSettings: CropSettings) => {
    setHistory((prev) => [...prev.slice(-20), cropSettings]);
    setRedoStack([]);
    setCropSettings(newSettings);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [...r, cropSettings]);
    setHistory((h) => h.slice(0, h.length - 1));
    setCropSettings(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((h) => [...h, cropSettings]);
    setRedoStack((r) => r.slice(0, r.length - 1));
    setCropSettings(next);
  };

  const socialPresets: SocialPreset[] = [
    { id: 'ig_post', name: 'IG Post (1:1)', platform: 'Instagram', width: 1080, height: 1080, aspectRatio: 1, iconName: 'Square' },
    { id: 'ig_portrait', name: 'IG Portrait (4:5)', platform: 'Instagram', width: 1080, height: 1350, aspectRatio: 0.8, iconName: 'Square' },
    { id: 'fb_cover', name: 'FB Cover', platform: 'Facebook', width: 1200, height: 628, aspectRatio: 1.91, iconName: 'Square' },
    { id: 'tw_header', name: 'X / Twitter Banner', platform: 'Twitter', width: 1500, height: 500, aspectRatio: 3, iconName: 'Square' },
    { id: 'yt_thumb', name: 'YouTube Thumbnail', platform: 'YouTube', width: 1280, height: 720, aspectRatio: 1.778, iconName: 'Square' },
  ];

  // Aspect ratio switch
  const handleSetAspectRatio = (ratio: number) => {
    let newW = cropSettings.cropWidth;
    let newH = cropSettings.cropHeight;
    if (ratio > 0) {
      newH = newW / ratio;
      if (cropSettings.cropY + newH > item.height) {
        newH = item.height - cropSettings.cropY;
        newW = newH * ratio;
      }
    }
    saveHistory({
      ...cropSettings,
      aspectRatio: ratio,
      cropWidth: Math.round(newW),
      cropHeight: Math.round(newH),
    });
  };

  const handleApplyPreset = (preset: SocialPreset) => {
    const ratio = preset.aspectRatio;
    let w = Math.min(item.width, preset.width);
    let h = w / ratio;
    if (h > item.height) {
      h = item.height;
      w = h * ratio;
    }
    const x = Math.max(0, Math.round((item.width - w) / 2));
    const y = Math.max(0, Math.round((item.height - h) / 2));

    saveHistory({
      ...cropSettings,
      aspectRatio: ratio,
      cropX: x,
      cropY: y,
      cropWidth: Math.round(w),
      cropHeight: Math.round(h),
      targetWidth: preset.width,
      targetHeight: preset.height,
    });
  };

  // Dragging crop overlay logic
  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (handle) {
      setIsResizing(handle);
    } else {
      setIsDragging(true);
    }
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      cropX: cropSettings.cropX,
      cropY: cropSettings.cropY,
      cropW: cropSettings.cropWidth,
      cropH: cropSettings.cropHeight,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = item.width / rect.width;
      const scaleY = item.height / rect.height;

      const dx = (e.clientX - dragStartRef.current.x) * scaleX;
      const dy = (e.clientY - dragStartRef.current.y) * scaleY;

      const { cropX, cropY, cropW, cropH } = dragStartRef.current;

      if (isDragging) {
        const nextX = Math.max(0, Math.min(cropX + dx, item.width - cropW));
        const nextY = Math.max(0, Math.min(cropY + dy, item.height - cropH));
        setCropSettings((prev) => ({
          ...prev,
          cropX: Math.round(nextX),
          cropY: Math.round(nextY),
        }));
      } else if (isResizing) {
        let nw = cropW;
        let nh = cropH;
        let nx = cropX;
        let ny = cropY;

        if (isResizing.includes('r')) {
          nw = Math.max(20, Math.min(cropW + dx, item.width - cropX));
        }
        if (isResizing.includes('l')) {
          const maxLeftShift = cropX + cropW - 20;
          nx = Math.max(0, Math.min(cropX + dx, maxLeftShift));
          nw = cropW + (cropX - nx);
        }
        if (isResizing.includes('b')) {
          nh = Math.max(20, Math.min(cropH + dy, item.height - cropY));
        }
        if (isResizing.includes('t')) {
          const maxTopShift = cropY + cropH - 20;
          ny = Math.max(0, Math.min(cropY + dy, maxTopShift));
          nh = cropH + (cropY - ny);
        }

        if (cropSettings.aspectRatio > 0) {
          nh = nw / cropSettings.aspectRatio;
        }

        setCropSettings((prev) => ({
          ...prev,
          cropX: Math.round(nx),
          cropY: Math.round(ny),
          cropWidth: Math.round(nw),
          cropHeight: Math.round(nh),
        }));
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, item.width, item.height, cropSettings.aspectRatio]);

  const handleProcessCrop = async () => {
    setIsProcessing(true);
    try {
      const result = await processCrop(item, cropSettings);
      onResult(result);
    } catch (e) {
      console.error('Crop failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Position crop overlay relative percentages
  const leftPct = (cropSettings.cropX / item.width) * 100;
  const topPct = (cropSettings.cropY / item.height) * 100;
  const widthPct = (cropSettings.cropWidth / item.width) * 100;
  const heightPct = (cropSettings.cropHeight / item.height) * 100;

  return (
    <div className="bg-white border border-[#E1E4EA] rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 text-[#1A1C1E]">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1E4EA] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#1A1C1E] flex items-center gap-2">
            <Crop className="w-5 h-5 text-[#2D31FA]" />
            Interactive Crop & Transform
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Precision crop box, social media presets, circular avatar mask, and 90° rotation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 border border-slate-300 rounded-lg text-xs transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 border border-slate-300 rounded-lg text-xs transition"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleProcessCrop}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2D31FA] hover:bg-[#2024d4] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-[#FF4D00]" />
                Crop & Export
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interactive Canvas Display */}
        <div className="lg:col-span-2 space-y-3">
          <div
            ref={containerRef}
            className="relative w-full aspect-[16/10] bg-[#121316] rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center select-none shadow-xs"
          >
            <div
              className="relative max-w-full max-h-full transition-transform duration-200"
              style={{
                transform: `scale(${cropSettings.zoom / 100}) rotate(${
                  cropSettings.rotation
                }deg) scaleX(${cropSettings.flipX ? -1 : 1}) scaleY(${
                  cropSettings.flipY ? -1 : 1
                })`,
              }}
            >
              <img
                src={item.objectUrl}
                alt="Crop Target"
                className="max-h-[480px] w-auto object-contain pointer-events-none"
              />

              {/* Draggable Crop Overlay Mask */}
              <div
                onMouseDown={(e) => handleMouseDown(e)}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
                className={`absolute border-2 border-[#2D31FA] bg-[#2D31FA]/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] cursor-move transition-shadow ${
                  cropSettings.roundCrop ? 'rounded-full' : ''
                }`}
              >
                {/* 8 Resize Handles */}
                {!cropSettings.roundCrop && (
                  <>
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'tl')}
                      className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-[#2D31FA] rounded-full cursor-nwse-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'tr')}
                      className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-[#2D31FA] rounded-full cursor-nesw-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'bl')}
                      className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-[#2D31FA] rounded-full cursor-nesw-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'br')}
                      className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-[#2D31FA] rounded-full cursor-nwse-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 't')}
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-[#2D31FA] rounded-full cursor-ns-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'b')}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-[#2D31FA] rounded-full cursor-ns-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'l')}
                      className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#2D31FA] rounded-full cursor-ew-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, 'r')}
                      className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#2D31FA] rounded-full cursor-ew-resize shadow"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
            <span>
              Cropped Area:{' '}
              <strong className="text-[#2D31FA] font-bold">
                {cropSettings.cropWidth} × {cropSettings.cropHeight} px
              </strong>
            </span>
            <span>
              Zoom Level:{' '}
              <strong className="text-[#1A1C1E] font-bold">{cropSettings.zoom}%</strong>
            </span>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-5">
          {/* Aspect Ratio Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Free', ratio: 0 },
                { label: '1:1 Square', ratio: 1 },
                { label: '4:3 Standard', ratio: 1.333 },
                { label: '16:9 Wide', ratio: 1.778 },
                { label: '9:16 Story', ratio: 0.563 },
                { label: '3:4 Photo', ratio: 0.75 },
              ].map((r) => (
                <button
                  key={r.label}
                  onClick={() => handleSetAspectRatio(r.ratio)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition text-center ${
                    cropSettings.aspectRatio === r.ratio
                      ? 'bg-[#2D31FA] border-[#2D31FA] text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Round Crop Toggle */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-[#2D31FA]" />
              <span className="text-xs font-semibold text-[#1A1C1E]">
                Circular Avatar Mask
              </span>
            </div>
            <input
              type="checkbox"
              checked={cropSettings.roundCrop}
              onChange={(e) =>
                saveHistory({ ...cropSettings, roundCrop: e.target.checked })
              }
              className="rounded bg-white border-slate-300 text-[#2D31FA] focus:ring-[#2D31FA]"
            />
          </div>

          {/* Social Media Templates */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Social Media Quick Presets
            </label>
            <div className="space-y-1.5">
              {socialPresets.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => handleApplyPreset(sp)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#2D31FA] hover:bg-indigo-50/30 flex items-center justify-between transition group"
                >
                  <div>
                    <div className="text-xs font-bold text-[#1A1C1E] group-hover:text-[#2D31FA]">
                      {sp.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {sp.width} × {sp.height} px ({sp.platform})
                    </div>
                  </div>
                  <Maximize className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2D31FA]" />
                </button>
              ))}
            </div>
          </div>

          {/* Transforms & Rotations */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Rotation & Flipping
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() =>
                  saveHistory({
                    ...cropSettings,
                    rotation: (cropSettings.rotation - 90) % 360,
                  })
                }
                className="p-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-700 transition"
                title="Rotate Left 90°"
              >
                <RotateCcw className="w-4 h-4 text-[#2D31FA]" />
                <span>-90°</span>
              </button>

              <button
                onClick={() =>
                  saveHistory({
                    ...cropSettings,
                    rotation: (cropSettings.rotation + 90) % 360,
                  })
                }
                className="p-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-700 transition"
                title="Rotate Right 90°"
              >
                <RotateCw className="w-4 h-4 text-[#2D31FA]" />
                <span>+90°</span>
              </button>

              <button
                onClick={() =>
                  saveHistory({
                    ...cropSettings,
                    flipX: !cropSettings.flipX,
                  })
                }
                className={`p-2.5 border rounded-xl flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                  cropSettings.flipX
                    ? 'bg-[#2D31FA]/10 border-[#2D31FA] text-[#2D31FA]'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-4 h-4 text-[#2D31FA]" />
                <span>Flip H</span>
              </button>

              <button
                onClick={() =>
                  saveHistory({
                    ...cropSettings,
                    flipY: !cropSettings.flipY,
                  })
                }
                className={`p-2.5 border rounded-xl flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                  cropSettings.flipY
                    ? 'bg-[#2D31FA]/10 border-[#2D31FA] text-[#2D31FA]'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
                title="Flip Vertical"
              >
                <FlipVertical className="w-4 h-4 text-[#2D31FA]" />
                <span>Flip V</span>
              </button>
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Canvas Preview Zoom</span>
              <span className="font-bold text-[#2D31FA]">{cropSettings.zoom}%</span>
            </div>
            <div className="flex items-center gap-2">
              <ZoomOut className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="50"
                max="200"
                value={cropSettings.zoom}
                onChange={(e) =>
                  setCropSettings({ ...cropSettings, zoom: parseInt(e.target.value) })
                }
                className="flex-1 accent-[#2D31FA] cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
