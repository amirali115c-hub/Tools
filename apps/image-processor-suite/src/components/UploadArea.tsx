import React, { useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Clipboard, Sparkles, Plus, AlertCircle } from 'lucide-react';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSample: () => void;
  compact?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFilesSelected,
  onLoadSample,
  compact = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard Paste Handler (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const pastedFiles: File[] = [];
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const item = e.clipboardData.files[i];
          if (item.type.startsWith('image/')) {
            pastedFiles.push(item);
          }
        }
        if (pastedFiles.length > 0) {
          onFilesSelected(pastedFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const f = e.dataTransfer.files[i];
        if (f.type.startsWith('image/')) {
          droppedFiles.push(f);
        }
      }
      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected: File[] = (Array.from(e.target.files) as File[]).filter((f) =>
        f.type.startsWith('image/')
      );
      if (selected.length > 0) {
        onFilesSelected(selected);
      }
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#2D31FA] hover:bg-[#2024d4] text-white font-semibold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Add Images
        </button>
        <button
          onClick={onLoadSample}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
          Sample Image
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer ${
        isDragOver
          ? 'border-[#2D31FA] bg-indigo-50/60 scale-[1.01]'
          : 'border-slate-300 hover:border-[#2D31FA] bg-white hover:bg-indigo-50/10 shadow-xs'
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="max-w-md mx-auto space-y-4 pointer-events-none">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#2D31FA]/10 border border-[#2D31FA]/20 flex items-center justify-center text-[#2D31FA] transition-transform duration-200">
          <Upload className="w-8 h-8 text-[#2D31FA]" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#1A1C1E]">
            Drop images here or <span className="text-[#2D31FA] underline">browse</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Supports PNG, JPEG, WebP, AVIF, GIF, BMP • Multiple files supported
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-medium">
            <Clipboard className="w-3.5 h-3.5 text-[#2D31FA]" />
            Paste Ctrl+V
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-medium">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            Batch processing
          </span>
        </div>

        <div className="pt-2 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSample();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-[#FF4D00]" />
            Don't have an image? Load Sample Demo Image
          </button>
        </div>
      </div>
    </div>
  );
};
