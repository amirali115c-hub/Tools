import React, { useState } from 'react';
import { StarterTemplateKey, CrawlerCategory, CrawlerAccessStatus } from '../types';
import { STARTER_TEMPLATES } from '../data/samples';
import { MAJOR_CRAWLERS } from '../data/crawlers';
import { parseRobotsTxt } from '../utils/robotsParser';
import { analyzeRobotsTxt } from '../utils/robotsAnalyzer';
import {
  Wrench,
  Plus,
  Trash2,
  Copy,
  Download,
  Check,
  AlertTriangle,
  FileCode,
  LayoutTemplate,
  Globe,
  AlertCircle,
  FileText,
  Bot,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface GeneratorTabProps {
  onTestInChecker: (text: string) => void;
}

export const GeneratorTab: React.FC<GeneratorTabProps> = ({
  onTestInChecker,
}) => {
  // Crawler Preferences State: crawlerId -> 'allow' | 'block' | 'default'
  const [crawlerStatus, setCrawlerStatus] = useState<Record<string, CrawlerAccessStatus>>({
    gptbot: 'block',
    claudebot: 'block',
    perplexitybot: 'block',
    'google-extended': 'block',
    bytespider: 'block',
    ccbot: 'block',
  });

  // Active filter tab for crawler list
  const [activeCategory, setActiveCategory] = useState<CrawlerCategory | 'all'>('all');

  // Search filter inside crawler list
  const [searchFilter, setSearchFilter] = useState('');

  // Common Blocked / Allowed Paths under User-agent: *
  const [globalRules, setGlobalRules] = useState<
    Array<{ id: string; type: 'allow' | 'disallow'; pattern: string }>
  >([
    { id: 'r-1', type: 'disallow', pattern: '/admin/' },
    { id: 'r-2', type: 'disallow', pattern: '/private/' },
  ]);

  // Sitemap URLs
  const [sitemaps, setSitemaps] = useState<string[]>([
    'https://example.com/sitemap.xml',
  ]);

  // Option: Include sitemap path as Allow rule under User-agent: *
  const [autoAllowSitemapPath, setAutoAllowSitemapPath] = useState<boolean>(true);

  // Global Crawl Delay
  const [globalCrawlDelay, setGlobalCrawlDelay] = useState<string>('');

  // Custom User-Agent Groups (Advanced section)
  const [customGroups, setCustomGroups] = useState<
    Array<{
      id: string;
      userAgents: string[];
      rules: Array<{ id: string; type: 'allow' | 'disallow'; pattern: string }>;
      crawlDelay?: string;
    }>
  >([]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [generateSuccessToast, setGenerateSuccessToast] = useState(false);

  // Helper to update a single crawler's preference
  const setCrawlerAccess = (id: string, status: CrawlerAccessStatus) => {
    setCrawlerStatus((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  // Bulk Actions
  const handleBlockAllAI = () => {
    const next = { ...crawlerStatus };
    MAJOR_CRAWLERS.filter((c) => c.category === 'ai').forEach((c) => {
      next[c.id] = 'block';
    });
    setCrawlerStatus(next);
  };

  const handleAllowAllSearch = () => {
    const next = { ...crawlerStatus };
    MAJOR_CRAWLERS.filter((c) => c.category === 'search').forEach((c) => {
      next[c.id] = 'allow';
    });
    setCrawlerStatus(next);
  };

  const handleResetAllCrawlers = () => {
    setCrawlerStatus({});
  };

  // Quick Preset Paths
  const addPresetPath = (pattern: string, type: 'allow' | 'disallow' = 'disallow') => {
    if (globalRules.some((r) => r.pattern === pattern && r.type === type)) return;
    setGlobalRules((prev) => [
      ...prev,
      { id: `r-${Date.now()}-${Math.random()}`, type, pattern },
    ]);
  };

  // Generate Robots.txt String
  const generateRobotsText = (): string => {
    const lines: string[] = [];

    // 1. Primary User-agent: * Group
    lines.push('User-agent: *');

    if (globalCrawlDelay.trim()) {
      lines.push(`Crawl-delay: ${globalCrawlDelay.trim()}`);
    }

    // Explicitly add sitemap path as Allow if requested
    if (autoAllowSitemapPath) {
      sitemaps.forEach((sm) => {
        try {
          if (sm.trim()) {
            const urlObj = new URL(sm.trim());
            const pathname = urlObj.pathname || '/sitemap.xml';
            if (pathname && !globalRules.some((r) => r.pattern === pathname && r.type === 'allow')) {
              lines.push(`Allow: ${pathname}`);
            }
          }
        } catch {
          // If relative or raw string, extract path or use as is
          if (sm.trim().startsWith('/')) {
            lines.push(`Allow: ${sm.trim()}`);
          }
        }
      });
    }

    // Custom global rules
    globalRules.forEach((r) => {
      if (r.pattern.trim()) {
        if (r.type === 'allow') {
          lines.push(`Allow: ${r.pattern.trim()}`);
        } else {
          lines.push(`Disallow: ${r.pattern.trim()}`);
        }
      }
    });

    lines.push('');

    // 2. Individual Crawlers from Matrix
    MAJOR_CRAWLERS.forEach((c) => {
      const status = crawlerStatus[c.id] || 'default';
      if (status === 'block') {
        lines.push(`# Block ${c.name} (${c.owner})`);
        lines.push(`User-agent: ${c.userAgent}`);
        lines.push('Disallow: /');
        lines.push('');
      } else if (status === 'allow') {
        lines.push(`# Explicitly Allow ${c.name} (${c.owner})`);
        lines.push(`User-agent: ${c.userAgent}`);
        lines.push('Allow: /');
        lines.push('');
      }
    });

    // 3. Custom Advanced User-Agent Groups
    customGroups.forEach((g) => {
      if (g.userAgents.some((ua) => ua.trim())) {
        g.userAgents.forEach((ua) => {
          if (ua.trim()) lines.push(`User-agent: ${ua.trim()}`);
        });

        if (g.crawlDelay && g.crawlDelay.trim()) {
          lines.push(`Crawl-delay: ${g.crawlDelay.trim()}`);
        }

        g.rules.forEach((r) => {
          if (r.pattern.trim()) {
            lines.push(`${r.type === 'allow' ? 'Allow' : 'Disallow'}: ${r.pattern.trim()}`);
          }
        });

        lines.push('');
      }
    });

    // 4. Global Sitemaps at the end
    sitemaps.forEach((sm) => {
      if (sm.trim()) {
        lines.push(`Sitemap: ${sm.trim()}`);
      }
    });

    return lines.join('\n').trim() + '\n';
  };

  const rawGeneratedText = generateRobotsText();
  const parsed = parseRobotsTxt(rawGeneratedText);
  const diagnostics = analyzeRobotsTxt(parsed);
  const criticalIssues = diagnostics.filter((d) => d.severity === 'critical');

  const handleGenerateClick = () => {
    setGenerateSuccessToast(true);
    setTimeout(() => setGenerateSuccessToast(false), 3000);
  };

  const applyTemplate = (key: StarterTemplateKey) => {
    const tmpl = STARTER_TEMPLATES.find((t) => t.key === key);
    if (!tmpl) return;

    if (tmpl.sitemap) {
      setSitemaps([tmpl.sitemap]);
    } else {
      setSitemaps([]);
    }

    if (tmpl.key === 'staging') {
      // Staging blocks all
      setGlobalRules([{ id: 'r-1', type: 'disallow', pattern: '/' }]);
    } else if (tmpl.groups && tmpl.groups[0]) {
      const g0 = tmpl.groups[0];
      setGlobalRules(
        g0.rules.map((r, idx) => ({
          id: `r-${Date.now()}-${idx}`,
          type: r.type,
          pattern: r.pattern,
        }))
      );
    }
  };

  // Filter crawlers list
  const filteredCrawlers = MAJOR_CRAWLERS.filter((c) => {
    const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
    const matchesSearch =
      c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.userAgent.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.owner.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const executeCopy = () => {
    navigator.clipboard.writeText(rawGeneratedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeDownload = () => {
    const blob = new Blob([rawGeneratedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'robots.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportClick = (action: 'copy' | 'download') => {
    if (criticalIssues.length > 0) {
      setShowConfirmModal(true);
    } else {
      if (action === 'copy') executeCopy();
      if (action === 'download') executeDownload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Preset Starter Templates */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
            <LayoutTemplate className="w-4 h-4 text-indigo-400" />
            <span>Platform Starter Templates</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click to load baseline rules for your platform
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STARTER_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.key}
              onClick={() => applyTemplate(tmpl.key)}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left space-y-1 transition-all group cursor-pointer"
            >
              <div className="font-bold text-xs text-slate-200 group-hover:text-indigo-400 flex items-center justify-between">
                <span>{tmpl.name}</span>
              </div>
              <div className="text-[10px] text-slate-400 line-clamp-1">
                {tmpl.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Builder vs Real-time Code Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: CRAWLERS ACCESS MATRIX */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  Crawler & AI Bot Access Matrix
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select <span className="text-emerald-400 font-medium">Allow</span> or{' '}
                  <span className="text-rose-400 font-medium">Block</span> for each crawler based on your preference
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={handleBlockAllAI}
                  className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-all"
                  title="Set all AI & LLM training bots to Disallow: /"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Block All AI Bots</span>
                </button>
                <button
                  onClick={handleAllowAllSearch}
                  className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-all"
                  title="Explicitly allow major search engines"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Allow All Search</span>
                </button>
                <button
                  onClick={handleResetAllCrawlers}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] flex items-center space-x-1"
                  title="Reset crawlers to inherit standard * rules"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({MAJOR_CRAWLERS.length})
                </button>
                <button
                  onClick={() => setActiveCategory('search')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === 'search'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Search Engines
                </button>
                <button
                  onClick={() => setActiveCategory('ai')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === 'ai'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AI & LLM Bots
                </button>
                <button
                  onClick={() => setActiveCategory('social')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === 'social'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Social Media
                </button>
              </div>

              <input
                type="text"
                placeholder="Search crawler..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-40"
              />
            </div>

            {/* Crawler Cards Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredCrawlers.map((c) => {
                const status = crawlerStatus[c.id] || 'default';
                return (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                      status === 'block'
                        ? 'bg-rose-950/20 border-rose-800/50'
                        : status === 'allow'
                        ? 'bg-emerald-950/20 border-emerald-800/50'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-100 line-clamp-1">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                          {c.owner}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-indigo-300 mt-0.5">
                        {c.userAgent}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mt-1">
                        {c.description}
                      </p>
                    </div>

                    {/* 3-Way Choice Toggle Buttons */}
                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/60 text-center">
                      <button
                        onClick={() => setCrawlerAccess(c.id, 'allow')}
                        className={`py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          status === 'allow'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-slate-900 hover:bg-emerald-950/50 text-slate-400 border-slate-800'
                        }`}
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Allow</span>
                      </button>

                      <button
                        onClick={() => setCrawlerAccess(c.id, 'block')}
                        className={`py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          status === 'block'
                            ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                            : 'bg-slate-900 hover:bg-rose-950/50 text-slate-400 border-slate-800'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>Block</span>
                      </button>

                      <button
                        onClick={() => setCrawlerAccess(c.id, 'default')}
                        className={`py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer ${
                          status === 'default'
                            ? 'bg-slate-800 text-slate-200 border-slate-700'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                        title="Inherits standard User-agent: * rules"
                      >
                        Default
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: LINKS / PATHS TO BLOCK OR ALLOW */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  Global Blocked / Allowed Paths & Links
                </h3>
                <p className="text-[11px] text-slate-400">
                  Rules applied to all crawlers under <code className="text-amber-300">User-agent: *</code>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setGlobalRules([
                      ...globalRules,
                      { id: `r-${Date.now()}`, type: 'disallow', pattern: '/path/' },
                    ])
                  }
                  className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 text-xs rounded-lg font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Block Path</span>
                </button>
                <button
                  onClick={() =>
                    setGlobalRules([
                      ...globalRules,
                      { id: `r-${Date.now()}`, type: 'allow', pattern: '/public/' },
                    ])
                  }
                  className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 text-xs rounded-lg font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Allow Path</span>
                </button>
              </div>
            </div>

            {/* Quick Presets Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Quick Add Common Blocked Paths:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '/wp-admin/', path: '/wp-admin/' },
                  { label: '/admin/', path: '/admin/' },
                  { label: '/cart/', path: '/cart/' },
                  { label: '/checkout/', path: '/checkout/' },
                  { label: '/private/', path: '/private/' },
                  { label: '/search/', path: '/search/' },
                  { label: '/api/', path: '/api/' },
                  { label: '/*?*', path: '/*?*' },
                ].map((chip) => (
                  <button
                    key={chip.path}
                    onClick={() => addPresetPath(chip.path, 'disallow')}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-[11px] rounded-lg flex items-center space-x-1 transition-all"
                  >
                    <Plus className="w-2.5 h-2.5 text-rose-400" />
                    <span>Disallow: {chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rules List */}
            <div className="space-y-2">
              {globalRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800"
                >
                  <select
                    value={rule.type}
                    onChange={(e) =>
                      setGlobalRules(
                        globalRules.map((r) =>
                          r.id === rule.id
                            ? { ...r, type: e.target.value as 'allow' | 'disallow' }
                            : r
                        )
                      )
                    }
                    className={`text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none border ${
                      rule.type === 'allow'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                        : 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                    }`}
                  >
                    <option value="disallow">Disallow:</option>
                    <option value="allow">Allow:</option>
                  </select>

                  <input
                    type="text"
                    value={rule.pattern}
                    onChange={(e) =>
                      setGlobalRules(
                        globalRules.map((r) =>
                          r.id === rule.id ? { ...r, pattern: e.target.value } : r
                        )
                      )
                    }
                    placeholder="/path/ or URL path string"
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />

                  <button
                    onClick={() =>
                      setGlobalRules(globalRules.filter((r) => r.id !== rule.id))
                    }
                    className="text-slate-500 hover:text-rose-400 p-1 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Crawl-delay */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Crawl-Delay in seconds (supported by Bing, Yandex):
              </span>
              <input
                type="number"
                placeholder="e.g. 5"
                value={globalCrawlDelay}
                onChange={(e) => setGlobalCrawlDelay(e.target.value)}
                className="w-24 bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg px-2.5 py-1 text-center focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 3: SITEMAP URLS & ALLOW LIST */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                Sitemap URLs ({sitemaps.length})
              </h3>
              <button
                onClick={() =>
                  setSitemaps([...sitemaps, 'https://example.com/sitemap.xml'])
                }
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sitemap URL</span>
              </button>
            </div>

            {sitemaps.map((sm, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="text-xs font-mono font-semibold text-amber-400 shrink-0">
                  Sitemap:
                </span>
                <input
                  type="text"
                  value={sm}
                  onChange={(e) => {
                    const next = [...sitemaps];
                    next[idx] = e.target.value;
                    setSitemaps(next);
                  }}
                  placeholder="https://example.com/sitemap.xml"
                  className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => setSitemaps(sitemaps.filter((_, i) => i !== idx))}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <label className="flex items-center space-x-2 text-xs text-slate-300 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAllowSitemapPath}
                onChange={(e) => setAutoAllowSitemapPath(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
              />
              <span>
                Put sitemap paths (e.g. <code className="text-emerald-300">Allow: /sitemap.xml</code>) on the Allow list
              </span>
            </label>
          </div>

          {/* SECTION 4: ADVANCED CUSTOM GROUPS TOGGLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-200 hover:text-indigo-400"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                Advanced Custom User-Agent Rule Builder
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="pt-3 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Construct custom multi-UA blocks with dedicated rules
                  </span>
                  <button
                    onClick={() =>
                      setCustomGroups([
                        ...customGroups,
                        {
                          id: `g-${Date.now()}`,
                          userAgents: ['SpecialBot'],
                          rules: [
                            { id: `r-${Date.now()}`, type: 'disallow', pattern: '/internal/' },
                          ],
                        },
                      ])
                    }
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Group</span>
                  </button>
                </div>

                {customGroups.map((g) => (
                  <div key={g.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-indigo-400 font-semibold">User-agent:</span>
                        <input
                          type="text"
                          value={g.userAgents[0] || ''}
                          onChange={(e) =>
                            setCustomGroups(
                              customGroups.map((cg) =>
                                cg.id === g.id ? { ...cg, userAgents: [e.target.value] } : cg
                              )
                            )
                          }
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded px-2 py-1"
                        />
                      </div>
                      <button
                        onClick={() =>
                          setCustomGroups(customGroups.filter((cg) => cg.id !== g.id))
                        }
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {g.rules.map((r) => (
                      <div key={r.id} className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-slate-400">{r.type}:</span>
                        <input
                          type="text"
                          value={r.pattern}
                          onChange={(e) =>
                            setCustomGroups(
                              customGroups.map((cg) => {
                                if (cg.id === g.id) {
                                  return {
                                    ...cg,
                                    rules: cg.rules.map((cr) =>
                                      cr.id === r.id ? { ...cr, pattern: e.target.value } : cr
                                    ),
                                  };
                                }
                                return cg;
                              })
                            )
                          }
                          className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded px-2 py-1"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prominent Generate Action & Live Raw Output Preview */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">
          {/* PRIMARY GENERATE BUTTON */}
          <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-2xl p-4 shadow-xl space-y-3">
            <button
              onClick={handleGenerateClick}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>⚡ Generate Robots.txt File</span>
            </button>

            {generateSuccessToast && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-2 animate-pulse">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Robots.txt successfully updated with your preferences!</span>
              </div>
            )}

            <p className="text-[11px] text-indigo-200/80 text-center">
              Generates compliant standard rules for Googlebot, Bingbot, AI crawlers, blocked links, and sitemaps.
            </p>
          </div>

          {/* REALTIME RAW PREVIEW BOX */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                Live Generated Output
              </span>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Syncing Live
              </span>
            </div>

            <div className="p-4 bg-slate-950 font-mono text-xs leading-relaxed text-slate-200 min-h-[300px] max-h-[440px] overflow-auto whitespace-pre border-b border-slate-800 select-all">
              {rawGeneratedText}
            </div>

            {criticalIssues.length > 0 && (
              <div className="p-3 bg-rose-950/60 border-b border-rose-800/80 flex items-start space-x-2 text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Critical SEO Warning:</strong>{' '}
                  {criticalIssues[0].message}
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-900 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExportClick('copy')}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleExportClick('download')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-700 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download file</span>
                </button>
              </div>

              <button
                onClick={() => onTestInChecker(rawGeneratedText)}
                className="w-full px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Test in URL Checker & Diagnostics</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL IF BLOCK ALL DISALLOW IS ACTIVE */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-rose-200">
                Confirm Site Block Export
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-rose-950/40 p-3 rounded-xl border border-rose-800/60">
              This configuration contains <strong className="text-rose-200">Disallow: /</strong> under <strong className="text-rose-200">User-agent: *</strong>. Exporting and deploying this file will instruct all search engines to de-index your entire website!
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Cancel & Fix
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  executeCopy();
                  executeDownload();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Export Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
