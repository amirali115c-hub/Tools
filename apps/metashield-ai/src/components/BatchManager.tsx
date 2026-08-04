import React, { useState } from 'react';
import { ImageFileRecord, CleanOptions } from '../types';
import JSZip from 'jszip';
import {
  Cpu,
  Download,
  Trash2,
  ShieldCheck,
  CheckCircle,
  FileArchive,
  RefreshCw,
  Sparkles,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';

interface BatchManagerProps {
  records: ImageFileRecord[];
  onSelectRecord: (record: ImageFileRecord) => void;
  onCleanBatchFile: (record: ImageFileRecord) => Promise<void>;
  onCleanAllBatch: () => Promise<void>;
  onRemoveRecord: (id: string) => void;
  onClearAll: () => void;
  currentRecordId?: string;
}

export const BatchManager: React.FC<BatchManagerProps> = ({
  records,
  onSelectRecord,
  onCleanBatchFile,
  onCleanAllBatch,
  onRemoveRecord,
  onClearAll,
  currentRecordId,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [isBatchCleaning, setIsBatchCleaning] = useState(false);

  const cleanedCount = records.filter((r) => r.isCleaned).length;
  const totalTags = records.reduce((acc, r) => acc + (r.metadata?.length || 0), 0);
  const totalSavedBytes = records.reduce((acc, r) => acc + (r.cleanSavedBytes || 0), 0);

  const handleCleanAll = async () => {
    setIsBatchCleaning(true);
    await onCleanAllBatch();
    setIsBatchCleaning(false);
  };

  const handleDownloadZip = async () => {
    const cleanedRecords = records.filter((r) => r.cleanedBlob);
    if (cleanedRecords.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      cleanedRecords.forEach((rec) => {
        if (rec.cleanedBlob) {
          const ext = rec.type.includes('png') ? '.png' : rec.type.includes('webp') ? '.webp' : '.jpg';
          const cleanName = rec.name.replace(/\.[^.]+$/, '') + '_cleaned' + ext;
          zip.file(cleanName, rec.cleanedBlob);
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metashield_cleaned_batch_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-white/10 p-4 sm:p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#C5A059]" />
            <h3 className="font-bold text-white text-sm uppercase tracking-[0.2em]">Batch Operations Queue</h3>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Manage loaded image queue, bulk scrub privacy metadata, and export clean files in a ZIP archive.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCleanAll}
            disabled={isBatchCleaning || records.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-[#59C579] text-[#59C579] hover:bg-[#59C579] hover:text-black font-bold text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50"
          >
            {isBatchCleaning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Scrub All Files ({records.length})
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={isZipping || cleanedCount === 0}
            className="flex items-center gap-2 px-4 py-2 border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-black font-bold text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50"
          >
            {isZipping ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileArchive className="w-4 h-4" />
            )}
            Download ZIP ({cleanedCount})
          </button>

          {records.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-2 bg-[#0A0A0A] border border-white/10 hover:border-[#FF4B4B] text-white/40 hover:text-[#FF4B4B] transition-all"
              title="Clear all files"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#0A0A0A] border border-white/10 p-4">
          <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-[0.2em] block">Total Files Queue</span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">{records.length}</span>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-4">
          <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-[0.2em] block">Total Metadata Tags Found</span>
          <span className="text-xl font-bold text-[#C5A059] font-mono mt-1 block">{totalTags}</span>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-4">
          <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-[0.2em] block">Cleaned Files</span>
          <span className="text-xl font-bold text-[#59C579] font-mono mt-1 block">
            {cleanedCount} / {records.length}
          </span>
        </div>
      </div>

      {/* Queue Items List */}
      {records.length === 0 ? (
        <div className="p-8 text-center bg-[#0A0A0A] border border-white/10">
          <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/40">No image files in queue. Upload or select sample test files to begin batch scrubbing.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {records.map((rec) => {
            const isSelected = rec.id === currentRecordId;
            return (
              <div
                key={rec.id}
                onClick={() => onSelectRecord(rec)}
                className={`p-3.5 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#0A0A0A] border-[#C5A059] text-white'
                    : 'bg-[#0A0A0A] border-white/10 text-white/60 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={rec.previewUrl}
                    alt={rec.name}
                    className="w-12 h-12 object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate font-mono">{rec.name}</span>
                      {rec.isCleaned && (
                        <span className="px-2 py-0.5 text-[9px] font-bold text-[#59C579] border border-[#59C579]/40 uppercase tracking-widest flex items-center gap-1 font-mono">
                          <CheckCircle className="w-3 h-3" />
                          Cleaned
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40 font-mono">
                      <span>{(rec.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="text-[#C5A059] font-bold">{rec.metadata.length} Tags</span>

                      {rec.gpsCoords && (
                        <span className="text-[#FF4B4B] font-bold flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> GPS
                        </span>
                      )}

                      {rec.aiPromptDetails?.aiEngine && (
                        <span className="text-[#C5A059] font-bold flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3" /> AI
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* File Row Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCleanBatchFile(rec);
                    }}
                    className="px-3 py-1.5 border border-[#59C579] text-[#59C579] hover:bg-[#59C579] hover:text-black font-bold text-[10px] uppercase tracking-wider transition-all"
                  >
                    Scrub
                  </button>

                  {rec.cleanedBlob && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = URL.createObjectURL(rec.cleanedBlob!);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = rec.name.replace(/\.[^.]+$/, '') + '_clean';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-1.5 border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-black transition-all"
                      title="Download individual clean file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecord(rec.id);
                    }}
                    className="p-1.5 bg-[#0A0A0A] border border-white/10 hover:border-[#FF4B4B] text-white/40 hover:text-[#FF4B4B] transition-all"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
