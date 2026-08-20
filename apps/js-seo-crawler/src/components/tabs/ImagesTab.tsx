import {CrawlResult} from '../../types';

interface ImagesTabProps {
  result: CrawlResult;
}

export function ImagesTab({result}: ImagesTabProps) {
  const imagesWithAlt = result.images.filter((img) => img.hasAlt);
  const imagesWithoutAlt = result.images.filter((img) => !img.hasAlt);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Image Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{result.images.length}</div>
            <div className="text-[11px] text-slate-400">Total Images</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-emerald-400">{imagesWithAlt.length}</div>
            <div className="text-[11px] text-slate-400">With Alt Text</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-400">{imagesWithoutAlt.length}</div>
            <div className="text-[11px] text-slate-400">Missing Alt</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">All Images ({result.images.length})</h3>
        {result.images.length === 0 ? (
          <div className="p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">No images found</div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {result.images.map((img, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                <span className={`w-2 h-2 rounded-full shrink-0 ${img.hasAlt ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate" title={img.src}>{img.src}</div>
                  <div className="text-[11px] text-slate-500 truncate" title={img.alt || '(no alt text)'}>
                    {img.hasAlt ? img.alt : 'Missing alt text'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {imagesWithoutAlt.length > 0 && (
        <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
          <div className="text-xs font-medium text-red-400 mb-1">
            {imagesWithoutAlt.length} image{imagesWithoutAlt.length !== 1 ? 's' : ''} missing alt text
          </div>
          <div className="text-[11px] text-red-300/70">
            Alt text is important for accessibility and SEO. Search engines use it to understand image content.
          </div>
        </div>
      )}
    </div>
  );
}
