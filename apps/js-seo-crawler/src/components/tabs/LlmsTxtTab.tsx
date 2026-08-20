import {CrawlResult} from '../../types';
import {generateLlmsTxtTemplate} from '../../utils/llms-txt-validator';

interface LlmsTxtTabProps {
  result: CrawlResult;
}

export function LlmsTxtTab({result}: LlmsTxtTabProps) {
  const llmsTxt = result.phase1?.llmsTxt;

  if (!llmsTxt) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400">
        llms.txt analysis not available. Enter a URL to analyze.
      </div>
    );
  }

  const template = generateLlmsTxtTemplate(
    new URL(result.url).hostname.replace('www.', ''),
    [{title: 'Home', url: '/'}]
  );

  return (
    <div className="space-y-6">
      {/* Status */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">llms.txt Status</h3>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
              llmsTxt.exists ? 'bg-emerald-600' : 'bg-red-600'
            }`}>
              {llmsTxt.exists ? '✓' : '✗'}
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                {llmsTxt.exists ? 'llms.txt Found' : 'llms.txt Not Found'}
              </div>
              <div className="text-xs text-slate-400 font-mono">{llmsTxt.url}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation */}
      {llmsTxt.exists && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Validation</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-lg p-3 text-center border ${
              llmsTxt.hasOrganization
                ? 'bg-emerald-900/20 border-emerald-800'
                : 'bg-red-900/20 border-red-800'
            }`}>
              <div className={`text-lg font-bold ${llmsTxt.hasOrganization ? 'text-emerald-400' : 'text-red-400'}`}>
                {llmsTxt.hasOrganization ? '✓' : '✗'}
              </div>
              <div className="text-[11px] text-slate-400">Organization</div>
            </div>
            <div className={`rounded-lg p-3 text-center border ${
              llmsTxt.hasDescription
                ? 'bg-emerald-900/20 border-emerald-800'
                : 'bg-red-900/20 border-red-800'
            }`}>
              <div className={`text-lg font-bold ${llmsTxt.hasDescription ? 'text-emerald-400' : 'text-red-400'}`}>
                {llmsTxt.hasDescription ? '✓' : '✗'}
              </div>
              <div className="text-[11px] text-slate-400">Description</div>
            </div>
            <div className={`rounded-lg p-3 text-center border ${
              llmsTxt.hasPages
                ? 'bg-emerald-900/20 border-emerald-800'
                : 'bg-red-900/20 border-red-800'
            }`}>
              <div className={`text-lg font-bold ${llmsTxt.hasPages ? 'text-emerald-400' : 'text-red-400'}`}>
                {llmsTxt.hasPages ? '✓' : '✗'}
              </div>
              <div className="text-[11px] text-slate-400">Pages Listed</div>
            </div>
          </div>
        </div>
      )}

      {/* Content Preview */}
      {llmsTxt.content && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">File Content</h3>
          <pre className="bg-slate-800/50 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto font-mono whitespace-pre-wrap">
            {llmsTxt.content}
          </pre>
        </div>
      )}

      {/* Issues */}
      {llmsTxt.issues.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Issues</h3>
          <div className="space-y-2">
            {llmsTxt.issues.map((issue, i) => (
              <div key={i} className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-xs text-red-300">
                {issue}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Suggestions</h3>
        <div className="space-y-2">
          {llmsTxt.suggestions.map((suggestion, i) => (
            <div key={i} className="p-3 bg-indigo-900/20 border border-indigo-800 rounded-lg text-xs text-indigo-300">
              {suggestion}
            </div>
          ))}
        </div>
      </div>

      {/* Template */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Generate llms.txt Template</h3>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-2">
            Copy this template and save it as <code className="bg-slate-700 px-1 rounded">/llms.txt</code> at your site root:
          </div>
          <pre className="bg-slate-900 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto font-mono whitespace-pre-wrap">
            {template}
          </pre>
        </div>
      </div>

      {/* What is llms.txt */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">What is llms.txt?</h3>
        <div className="space-y-2">
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Standard for AI Visibility</div>
            <div className="text-sm text-white">
              llms.txt is an emerging standard that helps AI assistants understand your website. It provides a structured summary of your organization, key pages, and content.
            </div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">How AI Uses It</div>
            <div className="text-sm text-white">
              When AI crawlers access your site, they look for llms.txt to quickly understand what your site is about, what pages are important, and how to describe your content in generated answers.
            </div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Best Practices</div>
            <div className="text-sm text-white">
              Keep it under 100 lines. Include your organization name, a brief description, and links to your most important pages. Update it when you add new key pages.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
