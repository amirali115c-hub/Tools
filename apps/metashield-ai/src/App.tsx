import React, { useState, useEffect, useCallback } from 'react';
import {
  ImageFileRecord,
  CleanOptions,
  AiPrivacyAudit,
} from './types';
import { parseImageMetadata } from './utils/binaryMetaParser';
import { cleanImageMetadata } from './utils/imageCleaner';
import { performClientSidePrivacyAudit } from './utils/privacyAuditEngine';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { MetadataInspector } from './components/MetadataInspector';
import { VisualForensics } from './components/VisualForensics';
import { GeminiAuditPanel } from './components/GeminiAuditPanel';
import { CleanerControls } from './components/CleanerControls';
import { BatchManager } from './components/BatchManager';
import {
  ShieldCheck,
  MapPin,
  Sparkles,
  FileImage,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<ImageFileRecord[]>([]);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inspector' | 'forensics' | 'audit' | 'cleaner' | 'batch'>('inspector');

  const [cleanOptions, setCleanOptions] = useState<CleanOptions>({
    stripExif: true,
    stripXmp: true,
    stripIcc: false, // Keep color space by default
    stripJfif: true,
    stripComments: true,
    stripPngChunks: true,
    useCanvasReencode: false,
    canvasFormat: 'image/jpeg',
    quality: 0.95,
  });

  const [isCleaning, setIsCleaning] = useState(false);

  const currentRecord = records.find((r) => r.id === currentRecordId) || records[0];

  const handleFilesSelect = useCallback(async (files: File[]) => {
    const newRecords: ImageFileRecord[] = [];

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const previewUrl = URL.createObjectURL(file);
      const parsed = parseImageMetadata(buffer, file.type, file.name, file.size);

      const rec: ImageFileRecord = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        arrayBuffer: buffer,
        metadata: parsed.metadata,
        gpsCoords: parsed.gpsCoords,
        aiPromptDetails: parsed.aiPromptDetails,
        isCleaned: false,
      };

      // Perform client-side privacy audit automatically
      rec.privacyAudit = performClientSidePrivacyAudit(rec);

      newRecords.push(rec);
    }

    setRecords((prev) => [...prev, ...newRecords]);
    if (newRecords.length > 0) {
      setCurrentRecordId(newRecords[0].id);
    }
  }, []);

  const handleRunAudit = async (record: ImageFileRecord) => {
    if (!record) return;

    setRecords((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, isAuditing: true } : r))
    );

    // Simulated short delay for responsive UI transition
    await new Promise((res) => setTimeout(res, 200));

    const audit = performClientSidePrivacyAudit(record);

    setRecords((prev) =>
      prev.map((r) =>
        r.id === record.id ? { ...r, privacyAudit: audit, isAuditing: false } : r
      )
    );
  };

  const handleCleanRecord = async (record: ImageFileRecord) => {
    if (!record) return;
    setIsCleaning(true);

    try {
      const cleanedBlob = await cleanImageMetadata(
        record.arrayBuffer,
        record.type,
        cleanOptions,
        record.previewUrl
      );

      const cleanedArrayBuffer = await cleanedBlob.arrayBuffer();
      const cleanedParsed = parseImageMetadata(
        cleanedArrayBuffer,
        record.type,
        record.name,
        cleanedBlob.size
      );

      const cleanedPreviewUrl = URL.createObjectURL(cleanedBlob);
      const savedBytes = Math.max(0, record.size - cleanedBlob.size);

      const tempRec: ImageFileRecord = {
        ...record,
        arrayBuffer: cleanedArrayBuffer,
        metadata: cleanedParsed.metadata,
        gpsCoords: cleanedParsed.gpsCoords,
        aiPromptDetails: cleanedParsed.aiPromptDetails,
        size: cleanedBlob.size,
      };
      const cleanedAudit = performClientSidePrivacyAudit(tempRec);

      setRecords((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? {
                ...r,
                arrayBuffer: cleanedArrayBuffer,
                metadata: cleanedParsed.metadata,
                gpsCoords: cleanedParsed.gpsCoords,
                aiPromptDetails: cleanedParsed.aiPromptDetails,
                cleanedBlob,
                cleanedPreviewUrl,
                isCleaned: true,
                cleanSavedBytes: savedBytes,
                privacyAudit: cleanedAudit,
              }
            : r
        )
      );
    } catch (err) {
      console.error('Cleaning failed:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleCleanAllBatch = async () => {
    setIsCleaning(true);
    for (const rec of records) {
      try {
        const cleanedBlob = await cleanImageMetadata(
          rec.arrayBuffer,
          rec.type,
          cleanOptions,
          rec.previewUrl
        );

        const cleanedArrayBuffer = await cleanedBlob.arrayBuffer();
        const cleanedParsed = parseImageMetadata(
          cleanedArrayBuffer,
          rec.type,
          rec.name,
          cleanedBlob.size
        );

        const cleanedPreviewUrl = URL.createObjectURL(cleanedBlob);
        const savedBytes = Math.max(0, rec.size - cleanedBlob.size);

        const tempRec: ImageFileRecord = {
          ...rec,
          arrayBuffer: cleanedArrayBuffer,
          metadata: cleanedParsed.metadata,
          gpsCoords: cleanedParsed.gpsCoords,
          aiPromptDetails: cleanedParsed.aiPromptDetails,
          size: cleanedBlob.size,
        };
        const cleanedAudit = performClientSidePrivacyAudit(tempRec);

        setRecords((prev) =>
          prev.map((r) =>
            r.id === rec.id
              ? {
                  ...r,
                  arrayBuffer: cleanedArrayBuffer,
                  metadata: cleanedParsed.metadata,
                  gpsCoords: cleanedParsed.gpsCoords,
                  aiPromptDetails: cleanedParsed.aiPromptDetails,
                  cleanedBlob,
                  cleanedPreviewUrl,
                  isCleaned: true,
                  cleanSavedBytes: savedBytes,
                  privacyAudit: cleanedAudit,
                }
              : r
          )
        );
      } catch (e) {
        console.error('Error batch cleaning file:', rec.name, e);
      }
    }
    setIsCleaning(false);
  };

  const handleRemoveRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (currentRecordId === id) {
      const remaining = records.filter((r) => r.id !== id);
      setCurrentRecordId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleClearAll = () => {
    records.forEach((r) => {
      if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
      if (r.cleanedPreviewUrl) URL.revokeObjectURL(r.cleanedPreviewUrl);
    });
    setRecords([]);
    setCurrentRecordId(null);
  };

  const totalTagsCount = currentRecord?.metadata?.length || 0;
  const cleanedCount = records.filter((r) => r.isCleaned).length;
  const hasGpsLeaks = records.some((r) => r.gpsCoords !== undefined);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#C5A059] selection:text-black">
      <Header
        fileCount={records.length}
        totalTagsCount={totalTagsCount}
        cleanedCount={cleanedCount}
        hasGpsLeaks={hasGpsLeaks}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Drop Zone & Load Area */}
        {records.length === 0 ? (
          <div className="py-8">
            <DropZone onFilesSelect={handleFilesSelect} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Horizontal Active Files Ribbon Bar */}
            <div className="bg-[#111111] border border-white/10 p-3 flex items-center justify-between gap-3 overflow-x-auto">
              <div className="flex items-center gap-2 overflow-x-auto">
                {records.map((rec) => {
                  const isSelected = rec.id === currentRecord?.id;
                  return (
                    <button
                      key={rec.id}
                      onClick={() => setCurrentRecordId(rec.id)}
                      className={`flex items-center gap-2.5 px-3 py-1.5 border transition-all shrink-0 font-mono text-xs ${
                        isSelected
                          ? 'bg-[#0A0A0A] border-[#C5A059] text-[#C5A059] font-bold'
                          : 'bg-[#0A0A0A] border-white/10 text-white/50 hover:text-white hover:border-white/30'
                      }`}
                    >
                      <img
                        src={rec.previewUrl}
                        alt={rec.name}
                        className="w-6 h-6 object-cover border border-white/10"
                      />
                      <span className="truncate max-w-[120px]">{rec.name}</span>

                      {rec.isCleaned && (
                        <span className="w-2 h-2 bg-[#59C579]"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] border border-white/10 hover:border-[#C5A059] text-[10px] font-mono font-bold text-white uppercase tracking-wider cursor-pointer transition-all">
                  <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                  Add Files
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files) handleFilesSelect(Array.from(e.target.files));
                    }}
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleClearAll}
                  className="p-1.5 bg-[#0A0A0A] border border-white/10 hover:border-[#FF4B4B] text-white/40 hover:text-[#FF4B4B] transition-all"
                  title="Clear loaded workspace"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TAB CONTENT VIEWS */}
            {currentRecord && (
              <div>
                {activeTab === 'inspector' && (
                  <MetadataInspector
                    currentRecord={currentRecord}
                    onCleanRecord={handleCleanRecord}
                    cleanOptions={cleanOptions}
                  />
                )}

                {activeTab === 'forensics' && (
                  <VisualForensics currentRecord={currentRecord} />
                )}

                {activeTab === 'audit' && (
                  <GeminiAuditPanel
                    currentRecord={currentRecord}
                    onRunAudit={handleRunAudit}
                    onTriggerClean={() => {
                      handleCleanRecord(currentRecord);
                      setActiveTab('cleaner');
                    }}
                  />
                )}

                {activeTab === 'cleaner' && (
                  <CleanerControls
                    options={cleanOptions}
                    setOptions={setCleanOptions}
                    onCleanCurrent={() => handleCleanRecord(currentRecord)}
                    onDownloadCleaned={() => {
                      if (currentRecord.cleanedBlob) {
                        const url = URL.createObjectURL(currentRecord.cleanedBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = currentRecord.name.replace(/\.[^.]+$/, '') + '_cleaned';
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                    isCleaned={currentRecord.isCleaned}
                    isCleaning={isCleaning}
                    savedBytes={currentRecord.cleanSavedBytes}
                    fileName={currentRecord.name}
                  />
                )}

                {activeTab === 'batch' && (
                  <BatchManager
                    records={records}
                    onSelectRecord={(rec) => setCurrentRecordId(rec.id)}
                    onCleanBatchFile={handleCleanRecord}
                    onCleanAllBatch={handleCleanAllBatch}
                    onRemoveRecord={handleRemoveRecord}
                    onClearAll={handleClearAll}
                    currentRecordId={currentRecord?.id}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
