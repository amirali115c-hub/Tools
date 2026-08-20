import {useState} from 'react';
import {CrawlResult} from '../../types';

interface MigrationTabProps {
  result: CrawlResult;
}

interface MigrationCrawl {
  url: string;
  title: string;
  metaDescription: string;
  headings: {level: number; text: string}[];
  links: {href: string; text: string}[];
  images: {src: string; alt: string}[];
  status: number;
}

interface MigrationDiff {
  type: 'added' | 'removed' | 'changed';
  category: string;
  item: string;
  before?: string;
  after?: string;
}

export function MigrationTab({result}: MigrationTabProps) {
  const [crawlA, setCrawlA] = useState<string>('');
  const [crawlB, setCrawlB] = useState<string>('');
  const [diffs, setDiffs] = useState<MigrationDiff[]>([]);
  const [showResults, setShowResults] = useState(false);

  const parseCrawlData = (json: string): MigrationCrawl | null => {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const compareCrawls = () => {
    const a = parseCrawlData(crawlA);
    const b = parseCrawlData(crawlB);

    if (!a || !b) {
      alert('Please paste valid JSON crawl data in both fields');
      return;
    }

    const newDiffs: MigrationDiff[] = [];

    // Title comparison
    if (a.title !== b.title) {
      newDiffs.push({
        type: a.title && !b.title ? 'removed' : !a.title && b.title ? 'added' : 'changed',
        category: 'Meta',
        item: 'Title',
        before: a.title || '(missing)',
        after: b.title || '(missing)',
      });
    }

    // Meta description comparison
    if (a.metaDescription !== b.metaDescription) {
      newDiffs.push({
        type: a.metaDescription && !b.metaDescription ? 'removed' : !a.metaDescription && b.metaDescription ? 'added' : 'changed',
        category: 'Meta',
        item: 'Meta Description',
        before: a.metaDescription || '(missing)',
        after: b.metaDescription || '(missing)',
      });
    }

    // Status code comparison
    if (a.status !== b.status) {
      newDiffs.push({
        type: 'changed',
        category: 'Technical',
        item: 'Status Code',
        before: String(a.status),
        after: String(b.status),
      });
    }

    // Headings comparison
    const headingsA = a.headings.map((h) => h.text).sort();
    const headingsB = b.headings.map((h) => h.text).sort();
    const removedHeadings = headingsA.filter((h) => !headingsB.includes(h));
    const addedHeadings = headingsB.filter((h) => !headingsA.includes(h));

    removedHeadings.forEach((h) => {
      newDiffs.push({type: 'removed', category: 'Headings', item: h});
    });
    addedHeadings.forEach((h) => {
      newDiffs.push({type: 'added', category: 'Headings', item: h});
    });

    // Links comparison
    const linksA = a.links.map((l) => l.href).sort();
    const linksB = b.links.map((l) => l.href).sort();
    const removedLinks = linksA.filter((l) => !linksB.includes(l));
    const addedLinks = linksB.filter((l) => !linksA.includes(l));

    removedLinks.forEach((l) => {
      newDiffs.push({type: 'removed', category: 'Links', item: l});
    });
    addedLinks.forEach((l) => {
      newDiffs.push({type: 'added', category: 'Links', item: l});
    });

    // Images comparison
    const imagesA = a.images.map((i) => i.src).sort();
    const imagesB = b.images.map((i) => i.src).sort();
    const removedImages = imagesA.filter((i) => !imagesB.includes(i));
    const addedImages = imagesB.filter((i) => !imagesA.includes(i));

    removedImages.forEach((i) => {
      newDiffs.push({type: 'removed', category: 'Images', item: i});
    });
    addedImages.forEach((i) => {
      newDiffs.push({type: 'added', category: 'Images', item: i});
    });

    setDiffs(newDiffs);
    setShowResults(true);
  };

  const added = diffs.filter((d) => d.type === 'added');
  const removed = diffs.filter((d) => d.type === 'removed');
  const changed = diffs.filter((d) => d.type === 'changed');

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Migration Comparison</h3>
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <div className="text-xs text-slate-400">
            Compare two crawls to detect changes during a site migration. Paste JSON crawl data from two different crawls (before and after migration).
          </div>
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Before Migration (JSON)</label>
          <textarea
            value={crawlA}
            onChange={(e) => setCrawlA(e.target.value)}
            placeholder='{"url":"...","title":"...","metaDescription":"...","headings":[],"links":[],"images":[],"status":200}'
            rows={8}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">After Migration (JSON)</label>
          <textarea
            value={crawlB}
            onChange={(e) => setCrawlB(e.target.value)}
            placeholder='{"url":"...","title":"...","metaDescription":"...","headings":[],"links":[],"images":[],"status":200}'
            rows={8}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
          />
        </div>
      </div>

      <button
        onClick={compareCrawls}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Compare Crawls
      </button>

      {/* Results */}
      {showResults && (
        <>
          {/* Summary */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Migration Summary</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-emerald-400">{added.length}</div>
                <div className="text-[11px] text-emerald-300/70">Added</div>
              </div>
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-400">{removed.length}</div>
                <div className="text-[11px] text-red-300/70">Removed</div>
              </div>
              <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-amber-400">{changed.length}</div>
                <div className="text-[11px] text-amber-300/70">Changed</div>
              </div>
            </div>
          </div>

          {/* Critical Changes */}
          {removed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-400 mb-3">Removed ({removed.length})</h3>
              <div className="space-y-2">
                {removed.map((diff, i) => (
                  <div key={i} className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 text-[10px] bg-red-900/50 text-red-400 rounded font-medium">
                        {diff.category}
                      </span>
                      <span className="text-xs text-red-300">{diff.item}</span>
                    </div>
                    {diff.before && (
                      <div className="text-xs text-red-400/60 font-mono mt-1">Before: {diff.before}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Added */}
          {added.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-emerald-400 mb-3">Added ({added.length})</h3>
              <div className="space-y-2">
                {added.map((diff, i) => (
                  <div key={i} className="p-3 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 text-[10px] bg-emerald-900/50 text-emerald-400 rounded font-medium">
                        {diff.category}
                      </span>
                      <span className="text-xs text-emerald-300">{diff.item}</span>
                    </div>
                    {diff.after && (
                      <div className="text-xs text-emerald-400/60 font-mono mt-1">After: {diff.after}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Changed */}
          {changed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-3">Changed ({changed.length})</h3>
              <div className="space-y-2">
                {changed.map((diff, i) => (
                  <div key={i} className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 text-[10px] bg-amber-900/50 text-amber-400 rounded font-medium">
                        {diff.category}
                      </span>
                      <span className="text-xs text-amber-300">{diff.item}</span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      {diff.before && (
                        <div className="text-xs text-red-400/60 font-mono">Before: {diff.before}</div>
                      )}
                      {diff.after && (
                        <div className="text-xs text-emerald-400/60 font-mono">After: {diff.after}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {diffs.length === 0 && (
            <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg text-center">
              <p className="text-sm text-emerald-400">No differences detected between the two crawls.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
