import {CrawlResult, AnalysisTab} from '../types';
import {OverviewTab} from './tabs/OverviewTab';
import {MetaTab} from './tabs/MetaTab';
import {HeadingsTab} from './tabs/HeadingsTab';
import {LinksTab} from './tabs/LinksTab';
import {ImagesTab} from './tabs/ImagesTab';
import {SchemaTab} from './tabs/SchemaTab';
import {SocialTab} from './tabs/SocialTab';
import {IssuesTab} from './tabs/IssuesTab';
import {RenderingTab} from './tabs/RenderingTab';
import {AICrawlersTab} from './tabs/AICrawlersTab';
import {LlmsTxtTab} from './tabs/LlmsTxtTab';
import {CWVTab} from './tabs/CWVTab';
import {JSHealthTab} from './tabs/JSHealthTab';
import {MigrationTab} from './tabs/MigrationTab';
import {downloadCSV, downloadJSON, downloadPDF} from '../utils/export';

interface ResultsPanelProps {
  result: CrawlResult;
  activeTab: AnalysisTab;
  setActiveTab: (tab: AnalysisTab) => void;
}

export function ResultsPanel({result, activeTab, setActiveTab}: ResultsPanelProps) {
  const errorCount = result.issues.filter((i) => i.type === 'error').length;
  const warningCount = result.issues.filter((i) => i.type === 'warning').length;

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Results</h2>
            <p className="text-xs text-slate-400 truncate max-w-md">{result.url}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadCSV(result)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              CSV
            </button>
            <button
              onClick={() => downloadJSON(result)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              JSON
            </button>
            <button
              onClick={() => downloadPDF(result)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{result.headings.length}</div>
            <div className="text-[11px] text-slate-400">Headings</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{result.links.length}</div>
            <div className="text-[11px] text-slate-400">Links</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{result.images.length}</div>
            <div className="text-[11px] text-slate-400">Images</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{result.schemas.length}</div>
            <div className="text-[11px] text-slate-400">Schemas</div>
          </div>
        </div>

        {(errorCount > 0 || warningCount > 0) && (
          <div className="flex gap-3 mt-3">
            {errorCount > 0 && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 min-h-[400px]">
        {activeTab === 'overview' && <OverviewTab result={result} />}
        {activeTab === 'meta' && <MetaTab result={result} />}
        {activeTab === 'headings' && <HeadingsTab result={result} />}
        {activeTab === 'links' && <LinksTab result={result} />}
        {activeTab === 'images' && <ImagesTab result={result} />}
        {activeTab === 'schema' && <SchemaTab result={result} />}
        {activeTab === 'social' && <SocialTab result={result} />}
        {activeTab === 'issues' && <IssuesTab result={result} />}
        {activeTab === 'rendering' && <RenderingTab result={result} />}
        {activeTab === 'ai-crawlers' && <AICrawlersTab result={result} />}
        {activeTab === 'llms-txt' && <LlmsTxtTab result={result} />}
        {activeTab === 'cwv' && <CWVTab result={result} />}
        {activeTab === 'js-health' && <JSHealthTab result={result} />}
        {activeTab === 'migration' && <MigrationTab result={result} />}
      </div>
    </div>
  );
}
