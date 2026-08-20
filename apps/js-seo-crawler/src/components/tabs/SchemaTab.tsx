import {CrawlResult} from '../../types';

interface SchemaTabProps {
  result: CrawlResult;
}

export function SchemaTab({result}: SchemaTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Structured Data (JSON-LD)</h3>
        {result.schemas.length === 0 ? (
          <div className="p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
            No JSON-LD structured data found on this page
          </div>
        ) : (
          <div className="space-y-3">
            {result.schemas.map((schema, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${schema.isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm font-medium text-white">{schema.type}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                    schema.isValid
                      ? 'bg-emerald-900/30 text-emerald-400'
                      : 'bg-red-900/30 text-red-400'
                  }`}>
                    {schema.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                <pre className="p-3 text-xs text-slate-300 overflow-x-auto font-mono">
                  {JSON.stringify(schema.data, null, 2)}
                </pre>
                {schema.errors.length > 0 && (
                  <div className="p-3 border-t border-slate-700">
                    {schema.errors.map((error, j) => (
                      <div key={j} className="text-xs text-red-400">{error}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Common Schema Types</h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p><span className="text-white">WebPage</span> - General page schema</p>
          <p><span className="text-white">Article</span> - Blog posts, news articles</p>
          <p><span className="text-white">Product</span> - Product listings</p>
          <p><span className="text-white">FAQPage</span> - FAQ sections</p>
          <p><span className="text-white">HowTo</span> - Step-by-step guides</p>
          <p><span className="text-white">Organization</span> - Company information</p>
        </div>
      </div>
    </div>
  );
}
