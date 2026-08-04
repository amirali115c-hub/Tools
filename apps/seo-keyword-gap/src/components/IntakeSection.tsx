import React, { useState } from 'react';
import { PageMetadata, KeywordVolumeItem } from '../types';
import { parsePageHtml, parseSitemapXml, parseUrlList, parsePagesCsv, parseVolumeCsv } from '../utils/parser';
import { Code, FileSpreadsheet, Globe, Plus, Upload, Trash2, Check, AlertTriangle, Key, Layers, ArrowRight, Link } from 'lucide-react';

interface IntakeSectionProps {
  competitorPages: PageMetadata[];
  ownPages: PageMetadata[];
  onAddCompetitorPages: (pages: PageMetadata[]) => void;
  onAddOwnPages: (pages: PageMetadata[]) => void;
  onClearCompetitorPages: () => void;
  onClearOwnPages: () => void;
  onUploadVolumeData: (items: KeywordVolumeItem[]) => void;
  volumeCount: number;
  seedKeywords: string[];
  onSetSeedKeywords: (kws: string[]) => void;
  onProceedToInventory: () => void;
}

export const IntakeSection: React.FC<IntakeSectionProps> = ({
  competitorPages,
  ownPages,
  onAddCompetitorPages,
  onAddOwnPages,
  onClearCompetitorPages,
  onClearOwnPages,
  onUploadVolumeData,
  volumeCount,
  seedKeywords,
  onSetSeedKeywords,
  onProceedToInventory
}) => {
  const [activeSite, setActiveSite] = useState<'competitor' | 'own'>('competitor');
  const [method, setMethod] = useState<'urls' | 'sitemap' | 'html' | 'csv'>('urls');

  // URL List Input State
  const [urlListText, setUrlListText] = useState('');

  // Single Page HTML Paste State
  const [htmlUrl, setHtmlUrl] = useState('');
  const [rawHtml, setRawHtml] = useState('');

  // Sitemap XML Paste State
  const [sitemapXml, setSitemapXml] = useState('');
  const [extractedSitemapPages, setExtractedSitemapPages] = useState<PageMetadata[]>([]);

  // CSV State
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);

  // Volume CSV State
  const [volumeMsg, setVolumeMsg] = useState('');

  // Seed Keywords input text
  const [seedInput, setSeedInput] = useState(seedKeywords.join('\n'));

  // Handler for adding URL List
  const handleAddUrlList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlListText.trim()) return;

    const metaPages = parseUrlList(urlListText, 'url_list');
    if (metaPages.length === 0) return;

    if (activeSite === 'competitor') {
      onAddCompetitorPages(metaPages);
    } else {
      onAddOwnPages(metaPages);
    }

    setUrlListText('');
  };

  // Handler for adding single HTML page
  const handleAddHtmlPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawHtml.trim()) return;

    const urlToUse = htmlUrl.trim() || `https://site.com/p${Date.now().toString().slice(-4)}`;
    const meta = parsePageHtml(rawHtml, urlToUse);

    if (activeSite === 'competitor') {
      onAddCompetitorPages([meta]);
    } else {
      onAddOwnPages([meta]);
    }

    setRawHtml('');
    setHtmlUrl('');
  };

  // Handler for parsing Sitemap XML
  const handleParseSitemap = () => {
    if (!sitemapXml.trim()) return;
    const metaPages = parseSitemapXml(sitemapXml);
    setExtractedSitemapPages(metaPages);
  };

  // Handler for adding Sitemap pages
  const handleAddSitemapPages = () => {
    if (extractedSitemapPages.length === 0) return;

    if (activeSite === 'competitor') {
      onAddCompetitorPages(extractedSitemapPages);
    } else {
      onAddOwnPages(extractedSitemapPages);
    }

    setSitemapXml('');
    setExtractedSitemapPages([]);
  };

  // Handler for uploading CSV file
  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingCsv(true);
    setCsvWarnings([]);

    try {
      const { pages, warnings } = await parsePagesCsv(file);
      setCsvWarnings(warnings);

      if (pages.length > 0) {
        if (activeSite === 'competitor') {
          onAddCompetitorPages(pages);
        } else {
          onAddOwnPages(pages);
        }
      }
    } catch (err) {
      setCsvWarnings(['Failed to parse CSV file. Ensure it is a valid CSV.']);
    } finally {
      setIsProcessingCsv(false);
      e.target.value = '';
    }
  };

  // Handler for uploading Keyword Volume CSV
  const handleVolumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const items = await parseVolumeCsv(file);
      onUploadVolumeData(items);
      setVolumeMsg(`Successfully loaded ${items.length} keyword search volume records.`);
    } catch (err) {
      setVolumeMsg('Error parsing volume CSV.');
    } finally {
      e.target.value = '';
    }
  };

  // Seed Keywords update
  const handleSaveSeedKeywords = () => {
    const list = seedInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    onSetSeedKeywords(list);
  };

  const currentCount = activeSite === 'competitor' ? competitorPages.length : ownPages.length;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner & Security Callout */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl">
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold tracking-tight text-indigo-200 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Step 1: Intake Site Content (Client-Side Only)
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Browsers block direct automated crawling of external websites due to CORS rules. To analyze a competitor’s site and your own, paste raw page HTML, sitemap XML, or upload a CSV export (e.g., Screaming Frog or custom export).
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-indigo-300 bg-indigo-900/40 border border-indigo-800/60 rounded-xl p-3">
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-400" />
              100% In-Browser Analysis
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-400" />
              No Backend / Zero Data Transmitted
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-400" />
              Flexible Multi-Page Loop
            </span>
          </div>
        </div>
      </div>

      {/* Target Site Selector: Competitor vs Own Site */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveSite('competitor')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            activeSite === 'competitor'
              ? 'bg-indigo-600/10 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
              activeSite === 'competitor' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              Target Site A
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
              {competitorPages.length} Pages Stored
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-3">Competitor's Website</h3>
          <p className="text-xs text-slate-500 mt-1">
            Enter competitor pages to identify their service offerings, blog topics, and target keywords.
          </p>
        </button>

        <button
          onClick={() => setActiveSite('own')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            activeSite === 'own'
              ? 'bg-blue-600/10 border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
              activeSite === 'own' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              Target Site B
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              {ownPages.length} Pages Stored
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-3">Your Own Website</h3>
          <p className="text-xs text-slate-500 mt-1">
            Enter your current pages to benchmark keyword coverage and find content gap opportunities.
          </p>
        </button>
      </div>

      {/* Intake Method Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Add Pages for <span className="text-indigo-600">{activeSite === 'competitor' ? "Competitor's Site" : "Your Own Site"}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your preferred method to feed page content into the browser.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setMethod('urls')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                method === 'urls' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link className="w-3.5 h-3.5" /> Paste URL List
            </button>
            <button
              onClick={() => setMethod('sitemap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                method === 'sitemap' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Sitemap XML
            </button>
            <button
              onClick={() => setMethod('html')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                method === 'html' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> Paste HTML
            </button>
            <button
              onClick={() => setMethod('csv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                method === 'csv' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV Upload
            </button>
          </div>
        </div>

        {/* Method 0: Paste URL List (Easiest) */}
        {method === 'urls' && (
          <form onSubmit={handleAddUrlList} className="mt-6 space-y-4">
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
              <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Fastest Method:</strong> Paste website links directly (one per line). Our local engine automatically converts URL path slugs into clean page titles, categorizes pages into Service vs Blog, and extracts target keywords!
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paste Website URLs (One URL per line)
              </label>
              <textarea
                rows={6}
                placeholder={`https://example.com/services/b2b-saas-marketing
https://example.com/services/enterprise-seo
https://example.com/blog/keyword-research-guide`}
                value={urlListText}
                onChange={e => setUrlListText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                You can paste as many URLs as you like.
              </span>
              <button
                type="submit"
                disabled={!urlListText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add URLs to {activeSite === 'competitor' ? 'Competitor' : 'Own'} List
              </button>
            </div>
          </form>
        )}

        {/* Method 1: Paste HTML */}
        {method === 'html' && (
          <form onSubmit={handleAddHtmlPage} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Page URL (for labeling & path classification)
              </label>
              <input
                type="text"
                placeholder="e.g. https://competitor.com/services/saas-marketing"
                value={htmlUrl}
                onChange={e => setHtmlUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paste Full Page HTML ("View Source")
              </label>
              <textarea
                rows={6}
                placeholder="Right-click on page -> View Page Source -> Copy all -> Paste here..."
                value={rawHtml}
                onChange={e => setRawHtml(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                You can add multiple pages in a loop.
              </span>
              <button
                type="submit"
                disabled={!rawHtml.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Page to {activeSite === 'competitor' ? 'Competitor' : 'Own'} List
              </button>
            </div>
          </form>
        )}

        {/* Method 2: Sitemap XML */}
        {method === 'sitemap' && (
          <div className="mt-6 space-y-4">
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Sitemap XML Parsing:</strong> Paste the XML content from a site's <code>sitemap.xml</code>. All <code>&lt;loc&gt;</code> URLs will be parsed and classified instantly via URL slug analysis!
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paste Raw sitemap.xml Content
              </label>
              <textarea
                rows={6}
                placeholder="Paste raw XML from https://example.com/sitemap.xml..."
                value={sitemapXml}
                onChange={e => setSitemapXml(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleParseSitemap}
                disabled={!sitemapXml.trim()}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-all cursor-pointer"
              >
                Extract Pages from XML
              </button>

              {extractedSitemapPages.length > 0 && (
                <button
                  onClick={handleAddSitemapPages}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  Add {extractedSitemapPages.length} Pages to {activeSite === 'competitor' ? 'Competitor' : 'Own'} List
                </button>
              )}
            </div>

            {extractedSitemapPages.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Parsed {extractedSitemapPages.length} Pages from Sitemap:
                </span>
                <ul className="text-xs text-slate-600 space-y-1 font-mono">
                  {extractedSitemapPages.slice(0, 8).map((p, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="truncate">{p.url}</span>
                      <span className="text-indigo-600 font-sans font-bold ml-2">→ {p.title}</span>
                    </li>
                  ))}
                  {extractedSitemapPages.length > 8 && (
                    <li className="text-indigo-600 italic">...and {extractedSitemapPages.length - 8} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Method 3: CSV Upload */}
        {method === 'csv' && (
          <div className="mt-6 space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-400 transition-all">
              <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                Upload CSV Export (Screaming Frog / Custom)
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Supports columns like URL, Title, H1, Meta Description, Word Count, Body Text.
              </p>
              <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-indigo-700 transition-all shadow-sm">
                Choose CSV File
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {isProcessingCsv && (
              <div className="text-xs text-indigo-600 font-semibold flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Parsing CSV rows...
              </div>
            )}

            {csvWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> CSV Validation Notes:
                </div>
                {csvWarnings.map((w, idx) => (
                  <p key={idx}>• {w}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stored Pages Summary Bar */}
        {currentCount > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">
              Currently stored for <span className="font-bold text-slate-900">{activeSite === 'competitor' ? "Competitor" : "Own Site"}</span>: {currentCount} pages
            </span>
            <button
              onClick={activeSite === 'competitor' ? onClearCompetitorPages : onClearOwnPages}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear {activeSite === 'competitor' ? 'Competitor' : 'Own'} Pages
            </button>
          </div>
        )}
      </div>

      {/* Optional Inputs Card (Keyword Search Volume CSV & Seed Keywords) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Optional Search Volume CSV */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-slate-900 text-sm">Optional: Upload Search Volume CSV</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload exported CSV from Keywords Everywhere or Google Keyword Planner (Keyword, Search Volume). The app weights TF-IDF suggestions against real search volume data.
          </p>

          <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-all">
            <Upload className="w-3.5 h-3.5" /> Select Volume CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleVolumeFileUpload}
              className="hidden"
            />
          </label>

          {volumeCount > 0 && (
            <span className="text-xs font-semibold text-emerald-600 block">
              ✓ Loaded {volumeCount} volume keywords
            </span>
          )}

          {volumeMsg && <p className="text-xs text-slate-600">{volumeMsg}</p>}
        </div>

        {/* Optional Priority Seed Keywords */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-slate-900 text-sm">Optional: Priority Seed Keywords</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter topics or core service keywords you already know you want to prioritize (one per line).
          </p>
          <textarea
            rows={3}
            value={seedInput}
            onChange={e => setSeedInput(e.target.value)}
            placeholder="e.g. b2b saas marketing&#10;enterprise seo&#10;ppc management"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button
            onClick={handleSaveSeedKeywords}
            className="px-3.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
          >
            Update Seed Keywords ({seedKeywords.length})
          </button>
        </div>

      </div>

      {/* Bottom CTA to Step 2 */}
      {(competitorPages.length > 0 || ownPages.length > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <h4 className="font-bold text-base text-slate-100">
              Ready to Classify & Extract Keywords
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              You have added {competitorPages.length} competitor pages and {ownPages.length} own site pages.
            </p>
          </div>
          <button
            onClick={onProceedToInventory}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-sm rounded-xl shadow-lg hover:from-indigo-600 hover:to-blue-700 transition-all cursor-pointer whitespace-nowrap"
          >
            Review Page Inventory & Overrides
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
