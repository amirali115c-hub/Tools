import React from 'react';
import { ActiveTool } from '../types';
import {
  Minimize2,
  RefreshCw,
  Crop,
  Sliders,
  Layers,
  ShieldCheck,
  Zap,
  Image as ImageIcon
} from 'lucide-react';

interface HeaderProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  fileCount: number;
  onLoadSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTool,
  setActiveTool,
  fileCount,
  onLoadSample,
}) => {
  const tools = [
    {
      id: 'compress' as ActiveTool,
      label: 'Compressor',
      icon: Minimize2,
      description: 'Reduce file size by up to 90%',
    },
    {
      id: 'convert' as ActiveTool,
      label: 'Converter',
      icon: RefreshCw,
      description: 'PNG, JPG, WebP, AVIF, GIF, BMP',
    },
    {
      id: 'crop' as ActiveTool,
      label: 'Crop & Rotate',
      icon: Crop,
      description: 'Aspect ratios, avatar circle, rotate, flip',
    },
    {
      id: 'enhance' as ActiveTool,
      label: 'Filters & Watermark',
      icon: Sliders,
      description: 'Adjust colors, blur, sharpen, overlay text',
    },
    {
      id: 'batch' as ActiveTool,
      label: 'Batch Studio',
      icon: Layers,
      description: 'Process & ZIP export multiple files',
      badge: fileCount > 0 ? `${fileCount}` : undefined,
    },
  ];

  return (
    <header className="bg-white/95 border-b border-[#E1E4EA] text-[#1A1C1E] sticky top-0 z-40 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16 border-b border-[#E1E4EA]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D31FA] flex items-center justify-center shadow-xs">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#1A1C1E] flex items-center gap-2">
                Image Processor Suite
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#2D31FA]/10 text-[#2D31FA] border border-[#2D31FA]/20 font-semibold">
                  Client-Side Pro
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                All-in-one compressor, converter, cropper & filter engine
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {fileCount === 0 && (
              <button
                onClick={onLoadSample}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl transition shadow-xs"
                title="Load sample high-resolution image"
              >
                <Zap className="w-3.5 h-3.5 text-[#FF4D00]" />
                Try Sample Image
              </button>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">100% Private Client-Side</span>
              <span className="sm:hidden">Private</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 py-2.5 overflow-x-auto scrollbar-none">
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2D31FA] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{t.label}</span>
                {t.badge && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
