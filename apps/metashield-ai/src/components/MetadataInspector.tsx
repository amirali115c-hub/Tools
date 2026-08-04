import React, { useState } from 'react';
import {
  ImageFileRecord,
  ImageMetadataItem,
  MetaType,
  CleanOptions,
} from '../types';
import { cleanImageMetadata } from '../utils/imageCleaner';
import {
  Search,
  Copy,
  Check,
  MapPin,
  Sparkles,
  Camera,
  Layers,
  Code,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Info,
  Trash2,
  Download,
  RefreshCw,
} from 'lucide-react';

interface MetadataInspectorProps {
  currentRecord: ImageFileRecord;
  onCleanRecord?: (record: ImageFileRecord) => void;
  cleanOptions?: CleanOptions;
}

export const MetadataInspector: React.FC<MetadataInspectorProps> = ({
  currentRecord,
  onCleanRecord,
  cleanOptions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'tags' | 'ai-prompt' | 'gps' | 'raw'>('tags');
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [localCleanedBlob, setLocalCleanedBlob] = useState<Blob | null>(
    currentRecord.cleanedBlob || null
  );

  const metadata = currentRecord.metadata || [];
  const aiDetails = currentRecord.aiPromptDetails;
  const gps = currentRecord.gpsCoords;

  const defaultCleanOptions: CleanOptions = cleanOptions || {
    stripExif: true,
    stripGps: true,
    stripIptc: true,
    stripXmp: true,
    stripComments: true,
    stripJfif: true,
    stripIcc: false,
    useCanvasReencode: false,
  };

  const categories = ['all', 'AI Workflow', 'Camera', 'GPS', 'Software', 'Image Specs', 'Other'];

  const filteredMetadata = metadata.filter((item) => {
    const matchesSearch =
      item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyPrompt = () => {
    if (aiDetails?.positivePrompt) {
      navigator.clipboard.writeText(aiDetails.positivePrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleScrubMetadata = async () => {
    setIsScrubbing(true);
    try {
      const blob = await cleanImageMetadata(
        currentRecord.arrayBuffer,
        currentRecord.type,
        defaultCleanOptions,
        currentRecord.previewUrl
      );
      setLocalCleanedBlob(blob);
      if (onCleanRecord) {
        onCleanRecord(currentRecord);
      }
    } catch (err) {
      console.error('Failed to scrub metadata:', err);
    } finally {
      setIsScrubbing(false);
    }
  };

  const handleDownloadCleanImage = () => {
    const targetBlob = localCleanedBlob || currentRecord.cleanedBlob;
    if (!targetBlob) return;

    const url = URL.createObjectURL(targetBlob);
    const ext = currentRecord.type === 'image/png' ? '.png' : currentRecord.type === 'image/webp' ? '.webp' : '.jpg';
    const baseName = currentRecord.name.replace(/\.[^.]+$/, '');
    const downloadName = `${baseName}_cleaned${ext}`;

    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeBlob = localCleanedBlob || currentRecord.cleanedBlob;
  const isCleaned = !!activeBlob || currentRecord.isCleaned;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Top Inspector Header Bar */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={currentRecord.previewUrl}
            alt={currentRecord.name}
            className="w-12 h-12 object-cover rounded-xl border border-slate-800 shrink-0"
          />
          <div>
            <h3 className="font-bold text-slate-100 text-sm truncate max-w-xs">{currentRecord.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span>{(currentRecord.size / 1024).toFixed(1)} KB</span>
              <span>•</span>
              <span className="uppercase font-semibold text-slate-300">{currentRecord.type.replace('image/', '')}</span>
              <span>•</span>
              <span className="text-sky-400 font-medium">{metadata.length} Tags Extracted</span>
            </div>
          </div>
        </div>

        {/* Action Header Button & Sub-tab Switches */}
        <div className="flex flex-wrap items-center gap-2">
          {!isCleaned ? (
            <button
              onClick={handleScrubMetadata}
              disabled={isScrubbing}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {isScrubbing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Scrubbing Metadata...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Metadata
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleDownloadCleanImage}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download Clean Image
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('tags')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'tags'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Tags ({metadata.length})
            </button>

            {aiDetails && (aiDetails.positivePrompt || aiDetails.aiEngine) && (
              <button
                onClick={() => setActiveSubTab('ai-prompt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeSubTab === 'ai-prompt'
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'text-purple-400 hover:text-purple-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                AI Prompt
              </button>
            )}

            {gps && (
              <button
                onClick={() => setActiveSubTab('gps')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeSubTab === 'gps'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                GPS Location
              </button>
            )}

            <button
              onClick={() => setActiveSubTab('raw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'raw'
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Raw
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: TAG EXPLORER & QUICK METADATA REMOVER */}
      {activeSubTab === 'tags' && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* PROMINENT METADATA REMOVER CARD */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-xl border shrink-0 ${isCleaned ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400' : 'bg-slate-900 border-slate-800 text-sky-400'}`}>
                {isCleaned ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6 text-amber-400" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  {isCleaned ? 'Metadata Scrubbed & Cleaned' : 'Quick Metadata Remover'}
                  {isCleaned && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      100% Privacy Cleaned
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                  {isCleaned
                    ? `Metadata scrubbed client-side! Original size: ${(currentRecord.size / 1024).toFixed(1)} KB → Cleaned size: ${(activeBlob ? activeBlob.size / 1024 : currentRecord.size / 1024).toFixed(1)} KB.`
                    : 'Instantly strip EXIF, GPS location, AI prompt parameters, C2PA manifests, camera signatures, and software comments from this image directly.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
              {!isCleaned ? (
                <button
                  onClick={handleScrubMetadata}
                  disabled={isScrubbing}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isScrubbing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Scrubbing Binary Tags...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove Metadata Now
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDownloadCleanImage}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Clean Image
                </button>
              )}
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search EXIF tags, camera models, software..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
                    categoryFilter === cat
                      ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Table */}
          {filteredMetadata.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80">
              <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                {searchTerm
                  ? 'No metadata tags match your search query.'
                  : 'No embedded metadata tags found in this file.'}
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
              <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-800/60">
                {filteredMetadata.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 hover:bg-slate-900/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          item.type === 'AI DETECTED'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800/50'
                            : item.type === 'GPS'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                            : item.type === 'EXIF'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800/50'
                            : item.type === 'XMP'
                            ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/50'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="font-semibold text-xs text-slate-300 shrink-0">
                        {item.key}:
                      </span>
                      <span className="text-xs text-slate-200 font-mono break-all line-clamp-2">
                        {item.value}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(item.value, `${item.type}-${idx}`)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 shrink-0 self-end sm:self-center transition-all"
                      title="Copy tag value"
                    >
                      {copiedKey === `${item.type}-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: AI PROMPT & WORKFLOW */}
      {activeSubTab === 'ai-prompt' && aiDetails && (
        <div className="p-4 sm:p-6 space-y-5">
          <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-100 text-sm">
                  Extracted AI Generation Parameters
                </h4>
                {aiDetails.aiEngine && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/60 text-purple-300 border border-purple-700/50">
                    {aiDetails.aiEngine}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Parsed from embedded PNG chunks, XMP tags, or comment streams.
              </p>
            </div>
          </div>

          {/* Positive Prompt */}
          {aiDetails.positivePrompt && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                  Positive Prompt
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-xs text-slate-300 hover:text-purple-300 transition-all font-medium"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied Prompt!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Prompt
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-200 font-mono leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 select-all">
                {aiDetails.positivePrompt}
              </p>
            </div>
          )}

          {/* Negative Prompt */}
          {aiDetails.negativePrompt && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wide block mb-2">
                Negative Prompt
              </span>
              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                {aiDetails.negativePrompt}
              </p>
            </div>
          )}

          {/* Grid Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {aiDetails.model && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Model</span>
                <span className="text-xs font-bold text-slate-200 truncate block mt-0.5">{aiDetails.model}</span>
              </div>
            )}
            {aiDetails.seed && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Seed</span>
                <span className="text-xs font-bold text-amber-400 font-mono block mt-0.5">{aiDetails.seed}</span>
              </div>
            )}
            {aiDetails.steps && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Steps</span>
                <span className="text-xs font-bold text-sky-400 font-mono block mt-0.5">{aiDetails.steps}</span>
              </div>
            )}
            {aiDetails.cfgScale && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">CFG Scale</span>
                <span className="text-xs font-bold text-emerald-400 font-mono block mt-0.5">{aiDetails.cfgScale}</span>
              </div>
            )}
            {aiDetails.sampler && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Sampler</span>
                <span className="text-xs font-bold text-purple-300 block mt-0.5">{aiDetails.sampler}</span>
              </div>
            )}
            {aiDetails.dimensions && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Dimensions</span>
                <span className="text-xs font-bold text-slate-200 block mt-0.5">{aiDetails.dimensions}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: GPS LOCATION */}
      {activeSubTab === 'gps' && gps && (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-100 text-sm">
                Embedded GPS Geolocation Warning
              </h4>
              <p className="text-xs text-amber-300/80 mt-1">
                This image contains exact geographic coordinates. Sharing this image un-scrubbed publicly can expose your physical address or real-world location.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Latitude</span>
                <p className="text-base font-bold text-slate-100 font-mono">{gps.lat}°</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Longitude</span>
                <p className="text-base font-bold text-slate-100 font-mono">{gps.lon}°</p>
              </div>
              {gps.alt && (
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Elevation / Altitude</span>
                  <p className="text-sm font-bold text-slate-200">{gps.alt} meters</p>
                </div>
              )}
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <h5 className="font-bold text-xs text-slate-200 mb-1">Open Location Map</h5>
                <p className="text-xs text-slate-400">View exact GPS coordinates on external interactive maps.</p>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <a
                  href={`https://www.google.com/maps?q=${gps.lat},${gps.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  View on Google Maps
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={`https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lon}#map=16/${gps.lat}/${gps.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-all font-medium"
                >
                  OpenStreetMap
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: RAW PAYLOAD */}
      {activeSubTab === 'raw' && (
        <div className="p-4 sm:p-6">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">
              Raw Extracted XML & Chunk Payload
            </span>
            <pre className="text-[11px] text-emerald-400 font-mono bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-[400px]">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

