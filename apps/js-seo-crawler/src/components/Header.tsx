import {AnalysisTab} from '../types';

interface HeaderProps {
  activeTab: AnalysisTab;
  setActiveTab: (tab: AnalysisTab) => void;
  hasResult: boolean;
}

const tabs: {id: AnalysisTab; label: string; group: string}[] = [
  {id: 'overview', label: 'Overview', group: 'basic'},
  {id: 'meta', label: 'Meta Tags', group: 'basic'},
  {id: 'headings', label: 'Headings', group: 'basic'},
  {id: 'links', label: 'Links', group: 'basic'},
  {id: 'images', label: 'Images', group: 'basic'},
  {id: 'schema', label: 'Schema', group: 'basic'},
  {id: 'social', label: 'Social', group: 'basic'},
  {id: 'issues', label: 'Issues', group: 'basic'},
  {id: 'rendering', label: 'JS Rendering', group: 'advanced'},
  {id: 'ai-crawlers', label: 'AI Crawlers', group: 'advanced'},
  {id: 'llms-txt', label: 'llms.txt', group: 'advanced'},
  {id: 'cwv', label: 'CWV', group: 'advanced'},
  {id: 'js-health', label: 'JS Health', group: 'advanced'},
  {id: 'migration', label: 'Migration', group: 'advanced'},
];

export function Header({activeTab, setActiveTab, hasResult}: HeaderProps) {
  return (
    <header className="border-b border-slate-900 bg-slate-950/95 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">JS SEO Crawler</h1>
              <p className="text-[11px] text-slate-500">Technical SEO Auditor</p>
            </div>
          </div>

          {hasResult && (
            <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? tab.group === 'advanced'
                        ? 'bg-purple-600 text-white'
                        : 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
