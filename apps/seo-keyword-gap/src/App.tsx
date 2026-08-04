import React, { useState, useEffect, useMemo } from 'react';
import { PageMetadata, ClassifiedPage, KeywordVolumeItem, PageCategory, GapOpportunity, AppState } from './types';
import { parsePageHtml } from './utils/parser';
import { classifyPage } from './utils/classifier';
import { processSiteKeywords } from './utils/tfidf';
import { generateGapAnalysis } from './utils/gapAnalysis';
import { SAMPLE_VOLUME_DATA, SAMPLE_SEED_KEYWORDS, getSampleCompetitorRawHtmlPages, getSampleOwnSiteRawHtmlPages } from './utils/sampleData';

import { Navbar } from './components/Navbar';
import { IntakeSection } from './components/IntakeSection';
import { PageInventory } from './components/PageInventory';
import { GapAnalysisView } from './components/GapAnalysisView';
import { TopicClustersView } from './components/TopicClustersView';
import { EntitySchemaView } from './components/EntitySchemaView';
import { InternalLinkView } from './components/InternalLinkView';
import { IntentEeattView } from './components/IntentEeattView';
import { TargetingPlanView } from './components/TargetingPlanView';

import {
  Layers,
  FileText,
  Target,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Zap,
  Download,
  Search,
  ArrowRight,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'optipath_seo_app_state_v3';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppState['activeTab']>('intake');

  // Raw Intake State
  const [competitorRawPages, setCompetitorRawPages] = useState<PageMetadata[]>([]);
  const [ownRawPages, setOwnRawPages] = useState<PageMetadata[]>([]);
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, PageCategory>>({});

  // Keyword volume data & seeds
  const [volumeList, setVolumeList] = useState<KeywordVolumeItem[]>([]);
  const [seedKeywords, setSeedKeywords] = useState<string[]>([]);

  // Convert volume list to Map for instant O(1) lookup
  const volumeMap = useMemo(() => {
    const map = new Map<string, KeywordVolumeItem>();
    volumeList.forEach(item => {
      if (item.keyword) {
        map.set(item.keyword.toLowerCase().trim(), item);
      }
    });
    return map;
  }, [volumeList]);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.competitorRawPages) setCompetitorRawPages(parsed.competitorRawPages);
        if (parsed.ownRawPages) setOwnRawPages(parsed.ownRawPages);
        if (parsed.categoryOverrides) setCategoryOverrides(parsed.categoryOverrides);
        if (parsed.volumeList) setVolumeList(parsed.volumeList);
        if (parsed.seedKeywords) setSeedKeywords(parsed.seedKeywords);
      } else {
        // Auto-load Demo Data on first session for seamless zero-friction experience
        loadDemoData();
      }
    } catch (err) {
      console.error('Failed to load local state:', err);
      loadDemoData();
    }
  }, []);

  // Save state to localStorage whenever data updates
  useEffect(() => {
    try {
      const stateToSave = {
        competitorRawPages,
        ownRawPages,
        categoryOverrides,
        volumeList,
        seedKeywords,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error('Failed to save state to localStorage:', err);
    }
  }, [competitorRawPages, ownRawPages, categoryOverrides, volumeList, seedKeywords]);

  // Helper: Load Sample Demo Data
  const loadDemoData = () => {
    const compPages = getSampleCompetitorRawHtmlPages().map(p => parsePageHtml(p.html, p.url));
    const ownPages = getSampleOwnSiteRawHtmlPages().map(p => parsePageHtml(p.html, p.url));

    setCompetitorRawPages(compPages);
    setOwnRawPages(ownPages);
    setVolumeList(SAMPLE_VOLUME_DATA);
    setSeedKeywords(SAMPLE_SEED_KEYWORDS);
    setCategoryOverrides({});
  };

  // Helper: Reset session
  const resetSession = () => {
    setCompetitorRawPages([]);
    setOwnRawPages([]);
    setCategoryOverrides({});
    setVolumeList([]);
    setSeedKeywords([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setActiveTab('intake');
  };

  // Add Competitor Pages
  const handleAddCompetitorPages = (pages: PageMetadata[]) => {
    setCompetitorRawPages(prev => [...prev, ...pages]);
  };

  // Add Own Site Pages
  const handleAddOwnPages = (pages: PageMetadata[]) => {
    setOwnRawPages(prev => [...prev, ...pages]);
  };

  // Clear Competitor Pages
  const handleClearCompetitor = () => {
    setCompetitorRawPages([]);
  };

  // Clear Own Pages
  const handleClearOwn = () => {
    setOwnRawPages([]);
  };

  // Override Category
  const handleCategoryOverride = (pageId: string, category: PageCategory) => {
    setCategoryOverrides(prev => ({
      ...prev,
      [pageId]: category
    }));
  };

  // Compute Processed Pages for Competitor Site
  const competitorClassifiedPages: ClassifiedPage[] = useMemo(() => {
    const classified = competitorRawPages.map(p => classifyPage(p, categoryOverrides[p.id]));
    return processSiteKeywords(classified, volumeMap, seedKeywords);
  }, [competitorRawPages, categoryOverrides, volumeMap, seedKeywords]);

  // Compute Processed Pages for Own Site
  const ownClassifiedPages: ClassifiedPage[] = useMemo(() => {
    const classified = ownRawPages.map(p => classifyPage(p, categoryOverrides[p.id]));
    return processSiteKeywords(classified, volumeMap, seedKeywords);
  }, [ownRawPages, categoryOverrides, volumeMap, seedKeywords]);

  // Compute Gap Opportunities
  const gaps: GapOpportunity[] = useMemo(() => {
    return generateGapAnalysis(competitorClassifiedPages, ownClassifiedPages);
  }, [competitorClassifiedPages, ownClassifiedPages]);

  // Summary Metrics
  const totalPages = competitorRawPages.length + ownRawPages.length;
  const totalKeywordsExtracted = useMemo(() => {
    const compKws = competitorClassifiedPages.reduce((acc, p) => acc + 1 + p.secondaryKeywords.length, 0);
    const ownKws = ownClassifiedPages.reduce((acc, p) => acc + 1 + p.secondaryKeywords.length, 0);
    return compKws + ownKws;
  }, [competitorClassifiedPages, ownClassifiedPages]);

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-900 flex flex-col">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadSampleData={loadDemoData}
        onResetSession={resetSession}
        competitorPageCount={competitorRawPages.length}
        ownPageCount={ownRawPages.length}
        gapCount={gaps.length}
      />

      <main className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Quick Stats Bar */}
        <div className="p-6 sm:p-8 pb-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                Analyzed Pages
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {totalPages}
              </div>
              <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                {competitorRawPages.length} Competitor • {ownRawPages.length} Own
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                Extracted Keyword Terms
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {totalKeywordsExtracted}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                TF-IDF n-gram phrases
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs border-l-4 border-l-amber-500">
              <div className="text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                Strategic Gaps Uncovered
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {gaps.length}
              </div>
              <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                High-priority content opportunities
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                Client Latency
              </div>
              <div className="text-2xl font-bold text-slate-900">
                0ms
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                100% Client-Side Engine
              </div>
            </div>

          </div>
        </div>

        {/* Main Content Area Views */}
        <div className="p-6 sm:p-8 flex-1">
          {activeTab === 'intake' && (
            <IntakeSection
              competitorPages={competitorRawPages}
              ownPages={ownRawPages}
              onAddCompetitorPages={handleAddCompetitorPages}
              onAddOwnPages={handleAddOwnPages}
              onClearCompetitorPages={handleClearCompetitor}
              onClearOwnPages={handleClearOwn}
              onUploadVolumeData={setVolumeList}
              volumeCount={volumeList.length}
              seedKeywords={seedKeywords}
              onSetSeedKeywords={setSeedKeywords}
              onProceedToInventory={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'inventory' && (
            <PageInventory
              competitorPages={competitorClassifiedPages}
              ownPages={ownClassifiedPages}
              onCategoryOverride={handleCategoryOverride}
              onProceedToGaps={() => setActiveTab('gaps')}
            />
          )}

          {activeTab === 'gaps' && (
            <GapAnalysisView
              gaps={gaps}
              ownPageCount={ownClassifiedPages.length}
              competitorPageCount={competitorClassifiedPages.length}
              onProceedToPlan={() => setActiveTab('clusters')}
            />
          )}

          {activeTab === 'clusters' && (
            <TopicClustersView
              competitorPages={competitorClassifiedPages}
              ownPages={ownClassifiedPages}
              gaps={gaps}
            />
          )}

          {activeTab === 'entities' && (
            <EntitySchemaView
              competitorPages={competitorClassifiedPages}
              ownPages={ownClassifiedPages}
            />
          )}

          {activeTab === 'linking' && (
            <InternalLinkView
              ownPages={ownClassifiedPages}
              gaps={gaps}
            />
          )}

          {activeTab === 'intent' && (
            <IntentEeattView
              competitorPages={competitorClassifiedPages}
              ownPages={ownClassifiedPages}
              gaps={gaps}
            />
          )}

          {activeTab === 'plan' && (
            <TargetingPlanView
              ownPages={ownClassifiedPages}
              competitorPages={competitorClassifiedPages}
              gaps={gaps}
            />
          )}
        </div>

      </main>
    </div>
  );
}
