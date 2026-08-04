import React, { useState, useEffect } from 'react';
import { ActiveTool, ImageFileItem, ProcessedResult } from './types';
import { Header } from './components/Header';
import { UploadArea } from './components/UploadArea';
import { CompressStudio } from './components/CompressStudio';
import { ConvertStudio } from './components/ConvertStudio';
import { CropStudio } from './components/CropStudio';
import { EnhanceStudio } from './components/EnhanceStudio';
import { BatchQueue } from './components/BatchQueue';
import { CompareSlider } from './components/CompareSlider';
import { createMetadataItem, triggerFileDownload, formatBytes } from './utils/imageEngine';
import { generateSampleFile } from './utils/sampleGenerator';
import {
  Image as ImageIcon,
  Trash2,
  Plus,
  Sparkles,
  Download,
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function App() {
  const [fileItems, setFileItems] = useState<ImageFileItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>('compress');
  const [results, setResults] = useState<Record<string, ProcessedResult>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tool = params.get('tool');
    if (tool === 'compress' || tool === 'convert' || tool === 'crop' || tool === 'enhance') {
      setActiveTool(tool);
    }
  }, []);

  // Active file item
  const activeItem = fileItems.find((i) => i.id === activeItemId) || fileItems[0] || null;
  const activeResult = activeItem ? results[activeItem.id] : undefined;

  const handleFilesSelected = async (files: File[]) => {
    setIsLoading(true);
    try {
      const newItems: ImageFileItem[] = [];
      for (const f of files) {
        const item = await createMetadataItem(f);
        newItems.push(item);
      }
      setFileItems((prev) => [...prev, ...newItems]);
      if (!activeItemId && newItems.length > 0) {
        setActiveItemId(newItems[0].id);
      }
    } catch (e) {
      console.error('Error adding files:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    try {
      const sampleFile = await generateSampleFile();
      const sampleItem = await createMetadataItem(sampleFile);
      setFileItems((prev) => [...prev, sampleItem]);
      setActiveItemId(sampleItem.id);
    } catch (e) {
      console.error('Sample generation failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setFileItems((prev) => prev.filter((i) => i.id !== id));
    setResults((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (activeItemId === id) {
      const remaining = fileItems.filter((i) => i.id !== id);
      setActiveItemId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleClearAll = () => {
    fileItems.forEach((i) => URL.revokeObjectURL(i.objectUrl));
    (Object.values(results) as ProcessedResult[]).forEach((r) => URL.revokeObjectURL(r.objectUrl));
    setFileItems([]);
    setResults({});
    setActiveItemId(null);
  };

  const handleSingleResult = (result: ProcessedResult) => {
    setResults((prev) => ({
      ...prev,
      [result.id]: result,
    }));
  };

  const handleBatchResults = (resultsList: ProcessedResult[]) => {
    const newMap: Record<string, ProcessedResult> = { ...results };
    resultsList.forEach((r) => {
      newMap[r.id] = r;
    });
    setResults(newMap);
  };

  const handleDownloadActiveResult = () => {
    if (activeResult) {
      triggerFileDownload(activeResult.blob, activeResult.filename);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#1A1C1E] flex flex-col font-sans antialiased">
      {/* Header */}
      <Header
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        fileCount={fileItems.length}
        onLoadSample={handleLoadSample}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {fileItems.length === 0 ? (
          /* Empty State / Upload Dropzone */
          <div className="max-w-3xl mx-auto pt-4 space-y-8">
            <UploadArea
              onFilesSelected={handleFilesSelected}
              onLoadSample={handleLoadSample}
            />

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-white border border-[#E1E4EA] rounded-2xl p-4 text-center shadow-xs transition hover:shadow-md">
                <div className="w-8 h-8 mx-auto bg-[#2D31FA]/10 text-[#2D31FA] rounded-xl flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="text-xs font-bold text-[#1A1C1E] mt-2.5">
                  Image Compressor
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Target KB size calculator & WebP auto-optimizer
                </p>
              </div>

              <div className="bg-white border border-[#E1E4EA] rounded-2xl p-4 text-center shadow-xs transition hover:shadow-md">
                <div className="w-8 h-8 mx-auto bg-[#2D31FA]/10 text-[#2D31FA] rounded-xl flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="text-xs font-bold text-[#1A1C1E] mt-2.5">
                  Format Converter
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Convert between PNG, JPG, WebP, AVIF, GIF & BMP
                </p>
              </div>

              <div className="bg-white border border-[#E1E4EA] rounded-2xl p-4 text-center shadow-xs transition hover:shadow-md">
                <div className="w-8 h-8 mx-auto bg-[#2D31FA]/10 text-[#2D31FA] rounded-xl flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h4 className="text-xs font-bold text-[#1A1C1E] mt-2.5">
                  Crop & Avatar Mask
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Aspect ratios, round crop, 90° rotate & social presets
                </p>
              </div>

              <div className="bg-white border border-[#E1E4EA] rounded-2xl p-4 text-center shadow-xs transition hover:shadow-md">
                <div className="w-8 h-8 mx-auto bg-[#2D31FA]/10 text-[#2D31FA] rounded-xl flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <h4 className="text-xs font-bold text-[#1A1C1E] mt-2.5">
                  Filters & Watermark
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Color adjustments, blur effects & copyright text overlay
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Studio Workstation */
          <div className="space-y-6">
            {/* Active File Queue Bar */}
            <div className="bg-white border border-[#E1E4EA] rounded-2xl p-3 flex items-center justify-between gap-3 overflow-x-auto shadow-xs">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {fileItems.map((item) => {
                  const isActive = item.id === activeItem?.id;
                  const hasRes = !!results[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveItemId(item.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition text-xs whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-[#2D31FA]/10 border-[#2D31FA] text-[#2D31FA] font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <img
                        src={item.objectUrl}
                        alt={item.name}
                        className="w-5 h-5 object-cover rounded-md bg-slate-200"
                      />
                      <span className="max-w-[120px] truncate">{item.name}</span>
                      {hasRes && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <UploadArea
                  onFilesSelected={handleFilesSelected}
                  onLoadSample={handleLoadSample}
                  compact
                />
                <button
                  onClick={handleClearAll}
                  className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition"
                  title="Clear All Files"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Tool Component Rendering */}
            {activeTool === 'compress' && activeItem && (
              <CompressStudio item={activeItem} onResult={handleSingleResult} />
            )}

            {activeTool === 'convert' && activeItem && (
              <ConvertStudio item={activeItem} onResult={handleSingleResult} />
            )}

            {activeTool === 'crop' && activeItem && (
              <CropStudio item={activeItem} onResult={handleSingleResult} />
            )}

            {activeTool === 'enhance' && activeItem && (
              <EnhanceStudio item={activeItem} onResult={handleSingleResult} />
            )}

            {activeTool === 'batch' && (
              <BatchQueue
                items={fileItems}
                results={results}
                onRemoveItem={handleRemoveItem}
                onClearAll={handleClearAll}
                onBatchResults={handleBatchResults}
              />
            )}

            {/* Split Comparison Viewer for Active File */}
            {activeItem && activeTool !== 'batch' && (
              <CompareSlider
                original={activeItem}
                result={activeResult}
                onDownload={handleDownloadActiveResult}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E1E4EA] bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">
            Image Processor Suite • High Density Client-Side Engine • Powered by Canvas API
          </p>
          <p className="text-[11px] text-slate-400">
            All processing is performed 100% locally in your browser memory. Zero cloud data storage or external API transmission.
          </p>
        </div>
      </footer>
    </div>
  );
}
