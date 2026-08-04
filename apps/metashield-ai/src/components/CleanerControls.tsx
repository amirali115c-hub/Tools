import React from 'react';
import { CleanOptions } from '../types';
import {
  ShieldCheck,
  Zap,
  Globe,
  Sparkles,
  Camera,
  Download,
  Settings2,
  Lock,
  Layers,
} from 'lucide-react';

interface CleanerControlsProps {
  options: CleanOptions;
  setOptions: React.Dispatch<React.SetStateAction<CleanOptions>>;
  onCleanCurrent: () => void;
  onDownloadCleaned: () => void;
  isCleaned: boolean;
  isCleaning: boolean;
  savedBytes?: number;
  fileName?: string;
}

export const CleanerControls: React.FC<CleanerControlsProps> = ({
  options,
  setOptions,
  onCleanCurrent,
  onDownloadCleaned,
  isCleaned,
  isCleaning,
  savedBytes,
  fileName,
}) => {
  const applyPreset = (preset: 'nuke' | 'social' | 'ai-only' | 'photographer') => {
    switch (preset) {
      case 'nuke':
        setOptions({
          stripExif: true,
          stripXmp: true,
          stripIcc: true,
          stripJfif: true,
          stripComments: true,
          stripPngChunks: true,
          useCanvasReencode: true,
          canvasFormat: 'image/jpeg',
          quality: 0.92,
        });
        break;
      case 'social':
        setOptions({
          stripExif: true,
          stripXmp: true,
          stripIcc: false, // keep color profile so colors stay rich
          stripJfif: true,
          stripComments: true,
          stripPngChunks: true,
          useCanvasReencode: false,
          canvasFormat: 'image/jpeg',
          quality: 0.95,
        });
        break;
      case 'ai-only':
        setOptions({
          stripExif: false,
          stripXmp: true,
          stripIcc: false,
          stripJfif: false,
          stripComments: true,
          stripPngChunks: true,
          useCanvasReencode: false,
          canvasFormat: 'image/jpeg',
          quality: 0.95,
        });
        break;
      case 'photographer':
        setOptions({
          stripExif: false, // preserve camera specs
          stripXmp: true, // remove AI prompts and personal metadata
          stripIcc: false,
          stripJfif: false,
          stripComments: true,
          stripPngChunks: true,
          useCanvasReencode: false,
          canvasFormat: 'image/jpeg',
          quality: 0.95,
        });
        break;
    }
  };

  return (
    <div className="bg-[#111111] border border-white/10 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#59C579]" />
            <h3 className="font-bold text-white text-sm uppercase tracking-[0.2em]">Metadata Scrubber Studio</h3>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Choose a preset or customize exact segment stripping rules to protect your privacy before sharing online.
          </p>
        </div>

        {/* Clean & Download Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCleanCurrent}
            disabled={isCleaning}
            className="flex items-center gap-2 px-5 py-2.5 border border-[#59C579] text-[#59C579] hover:bg-[#59C579] hover:text-black font-bold text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {isCleaning ? 'Scrubbing...' : 'Scrub Metadata'}
          </button>

          {isCleaned && (
            <button
              onClick={onDownloadCleaned}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-black font-bold text-[10px] uppercase tracking-[0.2em] transition-all"
            >
              <Download className="w-4 h-4" />
              Download Clean Image
            </button>
          )}
        </div>
      </div>

      {isCleaned && savedBytes !== undefined && (
        <div className="bg-[#0A0A0A] border border-[#59C579]/40 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#59C579] flex items-center justify-center text-[#59C579]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#59C579] text-xs uppercase tracking-wider">Image Successfully Scrubbed</h4>
              <p className="text-[11px] text-white/60 font-mono">
                Stripped privacy metadata. Saved {(savedBytes / 1024).toFixed(1)} KB of metadata bloat.
              </p>
            </div>
          </div>
          <button
            onClick={onDownloadCleaned}
            className="px-4 py-2 border border-[#59C579] text-[#59C579] hover:bg-[#59C579] hover:text-black text-[10px] uppercase tracking-widest font-bold transition-all"
          >
            Download
          </button>
        </div>
      )}

      {/* Preset Selectors */}
      <div>
        <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em] block mb-3">
          Quick Scrubbing Presets
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => applyPreset('nuke')}
            className="p-3.5 bg-[#0A0A0A] border border-white/10 hover:border-[#FF4B4B] text-left transition-all"
          >
            <div className="flex items-center gap-2 text-[#FF4B4B] font-bold text-xs uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              100% Total Nuke
            </div>
            <p className="text-[11px] text-white/40 leading-snug">
              Canvas re-encoding mode. Strips ALL binary segments, comments, and steganographic streams.
            </p>
          </button>

          <button
            onClick={() => applyPreset('social')}
            className="p-3.5 bg-[#0A0A0A] border border-white/10 hover:border-[#C5A059] text-left transition-all"
          >
            <div className="flex items-center gap-2 text-[#C5A059] font-bold text-xs uppercase tracking-wider mb-1">
              <Globe className="w-4 h-4" />
              Social Media Safe
            </div>
            <p className="text-[11px] text-white/40 leading-snug">
              Strips GPS coordinates, camera serials, and AI prompts. Preserves ICC color profile for accurate colors.
            </p>
          </button>

          <button
            onClick={() => applyPreset('ai-only')}
            className="p-3.5 bg-[#0A0A0A] border border-white/10 hover:border-[#C5A059] text-left transition-all"
          >
            <div className="flex items-center gap-2 text-[#C5A059] font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              AI Prompt Stripper
            </div>
            <p className="text-[11px] text-white/40 leading-snug">
              Removes embedded Midjourney, SDXL, and ComfyUI workflow prompts without altering image structure.
            </p>
          </button>

          <button
            onClick={() => applyPreset('photographer')}
            className="p-3.5 bg-[#0A0A0A] border border-white/10 hover:border-[#59C579] text-left transition-all"
          >
            <div className="flex items-center gap-2 text-[#59C579] font-bold text-xs uppercase tracking-wider mb-1">
              <Camera className="w-4 h-4" />
              Photographer Preserved
            </div>
            <p className="text-[11px] text-white/40 leading-snug">
              Keeps camera model & lens settings; strips personal comments, GPS tags, and author info.
            </p>
          </button>
        </div>
      </div>

      {/* Granular Toggles */}
      <div className="bg-[#0A0A0A] border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#C5A059]" />
            Granular Segment Scrubbing Rules
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <label className="flex items-center gap-2.5 p-3 bg-[#111111] border border-white/10 cursor-pointer hover:border-[#C5A059] transition-all">
            <input
              type="checkbox"
              checked={options.stripExif}
              onChange={(e) => setOptions({ ...options, stripExif: e.target.checked })}
              className="w-4 h-4 accent-[#C5A059]"
            />
            <div>
              <span className="text-xs font-bold text-white block uppercase tracking-wider font-mono">EXIF Data</span>
              <span className="text-[10px] text-white/40 block">Camera, GPS, Timestamps, Lens</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 bg-[#111111] border border-white/10 cursor-pointer hover:border-[#C5A059] transition-all">
            <input
              type="checkbox"
              checked={options.stripXmp}
              onChange={(e) => setOptions({ ...options, stripXmp: e.target.checked })}
              className="w-4 h-4 accent-[#C5A059]"
            />
            <div>
              <span className="text-xs font-bold text-white block uppercase tracking-wider font-mono">XMP Metadata</span>
              <span className="text-[10px] text-white/40 block">AI Prompts, Adobe Tags, Workflows</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 bg-[#111111] border border-white/10 cursor-pointer hover:border-[#C5A059] transition-all">
            <input
              type="checkbox"
              checked={options.stripIcc}
              onChange={(e) => setOptions({ ...options, stripIcc: e.target.checked })}
              className="w-4 h-4 accent-[#C5A059]"
            />
            <div>
              <span className="text-xs font-bold text-white block uppercase tracking-wider font-mono">ICC Color Profile</span>
              <span className="text-[10px] text-white/40 block">Color space profiles</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 bg-[#111111] border border-white/10 cursor-pointer hover:border-[#C5A059] transition-all">
            <input
              type="checkbox"
              checked={options.stripComments}
              onChange={(e) => setOptions({ ...options, stripComments: e.target.checked })}
              className="w-4 h-4 accent-[#C5A059]"
            />
            <div>
              <span className="text-xs font-bold text-white block uppercase tracking-wider font-mono">JPEG Comments</span>
              <span className="text-[10px] text-white/40 block">Raw prompt strings & text</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 bg-[#111111] border border-white/10 cursor-pointer hover:border-[#C5A059] transition-all">
            <input
              type="checkbox"
              checked={options.stripPngChunks}
              onChange={(e) => setOptions({ ...options, stripPngChunks: e.target.checked })}
              className="w-4 h-4 accent-[#C5A059]"
            />
            <div>
              <span className="text-xs font-bold text-white block uppercase tracking-wider font-mono">PNG Text Chunks</span>
              <span className="text-[10px] text-white/40 block">tEXt, iTXt, parameters</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 bg-[#111111] border border-white/10 cursor-pointer hover:border-[#59C579] transition-all">
            <input
              type="checkbox"
              checked={options.useCanvasReencode}
              onChange={(e) => setOptions({ ...options, useCanvasReencode: e.target.checked })}
              className="w-4 h-4 accent-[#59C579]"
            />
            <div>
              <span className="text-xs font-bold text-[#59C579] block uppercase tracking-wider font-mono">Canvas Pixel Re-encoding</span>
              <span className="text-[10px] text-white/40 block">100% Destruction mode</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
