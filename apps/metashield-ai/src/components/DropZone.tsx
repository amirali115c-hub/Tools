import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles, MapPin, Cpu, CheckCircle } from 'lucide-react';
import { SAMPLE_FILES, createSampleFileRecord } from '../utils/sampleData';

interface DropZoneProps {
  onFilesSelect: (files: File[]) => void;
  isLoadingSample?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelect, isLoadingSample }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = (Array.from(e.dataTransfer.files) as File[]).filter((f) =>
        f.type.match(/^image\/(jpeg|jpg|png|webp)$/i)
      );
      if (validFiles.length > 0) {
        onFilesSelect(validFiles);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = (Array.from(e.target.files) as File[]).filter((f) =>
        f.type.match(/^image\/(jpeg|jpg|png|webp)$/i)
      );
      if (validFiles.length > 0) {
        onFilesSelect(validFiles);
      }
    }
  };

  const handleLoadSample = async (sampleId: string) => {
    const sampleDef = SAMPLE_FILES.find((s) => s.id === sampleId);
    if (!sampleDef) return;
    const sampleFile = await createSampleFileRecord(sampleDef);
    onFilesSelect([sampleFile]);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-sky-400 bg-sky-950/20 shadow-xl shadow-sky-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/90'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
        />

        <div className="max-w-xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 text-sky-400 group-hover:scale-110 transition-transform shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-100 mb-2">
            Drop your image files here to inspect or clean
          </h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md">
            Supports <span className="text-slate-200 font-medium">JPEG, PNG, WebP</span> images.
            Inspect EXIF data, Midjourney/SD prompts, GPS coordinates, and scrub all tracking metadata client-side.
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition-all">
            <ImageIcon className="w-4 h-4" />
            Browse Image Files
          </div>
        </div>
      </div>

      {/* Quick Interactive Samples */}
      <div className="mt-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Try with Sample Test Files
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_FILES.map((sample) => (
            <button
              key={sample.id}
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSample(sample.id);
              }}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left hover:bg-slate-800/80 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:border-sky-500/50">
                {sample.id.includes('midjourney') ? (
                  <Sparkles className="w-5 h-5 text-purple-400" />
                ) : sample.id.includes('chatgpt') ? (
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                ) : sample.id.includes('gps') ? (
                  <MapPin className="w-5 h-5 text-amber-400" />
                ) : (
                  <Cpu className="w-5 h-5 text-sky-400" />
                )}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-slate-200 truncate">{sample.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">{sample.description}</p>
                <span className="inline-block mt-2 text-[10px] font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/50 px-2 py-0.5 rounded-full">
                  {sample.tagBadge}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
