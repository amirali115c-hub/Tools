import React, { useState } from 'react';
import { ImageFileItem, ProcessedResult, OutputFormat } from '../types';
import { formatBytes, downloadBatchZip, processCompress, processConvert } from '../utils/imageEngine';
import { Layers, Trash2, Download, Zap, RefreshCw, FileArchive, CheckCircle2, AlertCircle } from 'lucide-react';

interface BatchQueueProps {
  items: ImageFileItem[];
  results: Record<string, ProcessedResult>;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onBatchResults: (resultsList: ProcessedResult[]) => void;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  results,
  onRemoveItem,
  onClearAll,
  onBatchResults,
}) => {
  const [batchAction, setBatchAction] = useState<'compress' | 'convert'>('compress');
  const [targetFormat, setTargetFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const processedList = Object.values(results) as ProcessedResult[];
  const hasResults = processedList.length > 0;

  const handleProcessBatch = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setProgress({ done: 0, total: items.length });

    const newResults: ProcessedResult[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        let res: ProcessedResult;
        if (batchAction === 'compress') {
          res = await processCompress(item, {
            mode: 'quality',
            quality,
            targetSizeValue: 200,
            targetSizeUnit: 'KB',
            outputFormat: targetFormat,
            maxWidth: 0,
            maxHeight: 0,
            stripMeta: true,
            maintainAspectRatio: true,
          });
        } else {
          res = await processConvert(item, {
            outputFormat: targetFormat,
            quality,
            enableResize: false,
            resizeWidth: item.width,
            resizeHeight: item.height,
            scalePercent: 100,
            lockAspectRatio: true,
            transparentBackground: true,
            stripMetadata: true,
          });
        }
        newResults.push(res);
      } catch (e) {
        console.error(`Batch item failed (${item.name}):`, e);
      }
      setProgress({ done: i + 1, total: items.length });
    }

    onBatchResults(newResults);
    setIsProcessing(false);
  };

  const handleDownloadZip = async () => {
    if (processedList.length === 0) return;
    await downloadBatchZip(processedList, 'processed_images.zip');
  };

  const totalOriginalBytes = items.reduce((sum, item) => sum + item.originalSize, 0);
  const totalProcessedBytes = processedList.reduce(
    (sum, res) => sum + res.compressedSize,
    0
  );
  const totalSavedBytes = totalOriginalBytes - totalProcessedBytes;
  const overallSavingsPercent =
    totalOriginalBytes > 0
      ? Math.max(0, Math.round((totalSavedBytes / totalOriginalBytes) * 100))
      : 0;

  return (
    <div className="bg-white border border-[#E1E4EA] rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 text-[#1A1C1E]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1E4EA] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#1A1C1E] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#2D31FA]" />
            Batch Studio Queue ({items.length} Files)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Process multiple images simultaneously and export as a compressed ZIP file
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs rounded-xl transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Queue
          </button>

          {hasResults && (
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <FileArchive className="w-4 h-4 text-emerald-100" />
              Download All ZIP
            </button>
          )}
        </div>
      </div>

      {/* Batch Processing Settings Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase">
              Action
            </label>
            <select
              value={batchAction}
              onChange={(e) => setBatchAction(e.target.value as 'compress' | 'convert')}
              className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#1A1C1E]"
            >
              <option value="compress">Batch Compress Size</option>
              <option value="convert">Batch Convert Format</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase">
              Target Format
            </label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as OutputFormat)}
              className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#1A1C1E]"
            >
              <option value="image/webp">WebP (Next-Gen)</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/avif">AVIF</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase">
              Quality Level ({quality}%)
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full mt-2 accent-[#2D31FA] cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          {hasResults ? (
            <div className="text-xs text-emerald-700 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Saved {overallSavingsPercent}% overall ({formatBytes(totalSavedBytes)})
            </div>
          ) : (
            <div className="text-xs text-slate-600 font-medium">
              Total Original Size: <strong className="text-[#1A1C1E]">{formatBytes(totalOriginalBytes)}</strong>
            </div>
          )}

          <button
            onClick={handleProcessBatch}
            disabled={isProcessing || items.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2D31FA] hover:bg-[#2024d4] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing ({progress.done}/{progress.total})...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-[#FF4D00]" />
                Start Batch Processing
              </>
            )}
          </button>
        </div>

        {/* Progress bar */}
        {isProcessing && (
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2D31FA] h-full transition-all duration-300"
              style={{
                width: `${(progress.done / Math.max(1, progress.total)) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Item List Queue */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {items.map((item) => {
          const res = results[item.id];
          return (
            <div
              key={item.id}
              className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between gap-3 transition shadow-2xs"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={item.objectUrl}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-slate-100 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1A1C1E] truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {item.width} × {item.height} px • {formatBytes(item.originalSize)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {res ? (
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-700">
                      {formatBytes(res.compressedSize)} (-{res.savedPercent}%)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {res.filename}
                    </div>
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-600 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                    Pending
                  </span>
                )}

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded-lg transition"
                  title="Remove from queue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
