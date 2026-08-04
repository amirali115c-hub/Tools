import React from 'react';
import { Hop } from '../types';
import { Plus, Trash2, CornerDownRight } from 'lucide-react';

interface HopEditorProps {
  hops: Hop[];
  onChangeHops: (updatedHops: Hop[]) => void;
}

export const HopEditor: React.FC<HopEditorProps> = ({ hops, onChangeHops }) => {

  const handleHopChange = (index: number, field: keyof Hop, value: any) => {
    const newHops = [...hops];
    newHops[index] = {
      ...newHops[index],
      [field]: value,
    };

    if (field === 'statusCode') {
      const code = parseInt(value, 10);
      let type: Hop['redirectType'] = 'Custom';
      if (code === 200) type = '200 OK';
      else if (code === 301) type = '301 Permanent';
      else if (code === 302) type = '302 Found';
      else if (code === 303) type = '303 See Other';
      else if (code === 307) type = '307 Temporary';
      else if (code === 308) type = '308 Permanent';
      else if (code === 404) type = '404 Not Found';
      else if (code >= 500) type = '500 Server Error';

      newHops[index].statusCode = isNaN(code) ? undefined : code;
      newHops[index].redirectType = type;
    }

    onChangeHops(newHops);
  };

  const handleAddHop = (afterIndex?: number) => {
    const newHop: Hop = {
      id: `hop-manual-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      stepNumber: hops.length + 1,
      url: 'https://example.com/new-hop',
      statusCode: 301,
      statusText: 'Moved Permanently',
      redirectType: '301 Permanent',
    };

    if (typeof afterIndex === 'number') {
      const newHops = [...hops];
      newHops.splice(afterIndex + 1, 0, newHop);
      const reindexed = newHops.map((h, idx) => ({ ...h, stepNumber: idx + 1 }));
      onChangeHops(reindexed);
    } else {
      const newHops = [...hops, newHop];
      const reindexed = newHops.map((h, idx) => ({ ...h, stepNumber: idx + 1 }));
      onChangeHops(reindexed);
    }
  };

  const handleDeleteHop = (index: number) => {
    if (hops.length <= 1) return;
    const newHops = hops.filter((_, idx) => idx !== index);
    const reindexed = newHops.map((h, idx) => ({ ...h, stepNumber: idx + 1 }));
    onChangeHops(reindexed);
  };

  return (
    <div className="bg-white border border-[#141414] p-5 tech-shadow text-xs space-y-4 text-[#141414]">
      <div className="flex items-center justify-between pb-3 border-b border-[#141414]">
        <div>
          <span className="col-header block">CHAIN COMPOSER</span>
          <h3 className="text-sm font-black text-[#141414] uppercase tracking-tight">Manual Hop Sequence Builder</h3>
        </div>

        <button
          onClick={() => handleAddHop()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#F27D26] text-white font-mono text-xs uppercase font-bold transition-colors tech-shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>ADD HOP</span>
        </button>
      </div>

      <div className="space-y-3">
        {hops.map((hop, index) => {
          const isLast = index === hops.length - 1;

          return (
            <div key={hop.id} className="relative bg-[#E4E3E0] border border-[#141414] p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#141414] text-white font-bold mono text-[11px] flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-bold uppercase text-[#141414] mono">
                    {isLast ? 'FINAL DESTINATION' : `HOP #${index + 1}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddHop(index)}
                    className="flex items-center gap-1 px-2 py-1 bg-white border border-[#141414] text-[#141414] font-bold mono text-[10px] uppercase hover:bg-[#141414] hover:text-white transition-colors"
                    title="Insert new hop after this step"
                  >
                    <CornerDownRight className="w-3 h-3 text-[#F27D26]" />
                    <span>INSERT BELOW</span>
                  </button>

                  {hops.length > 1 && (
                    <button
                      onClick={() => handleDeleteHop(index)}
                      className="p-1 bg-red-600 text-white border border-[#141414] hover:bg-red-700 transition-colors"
                      title="Delete this hop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Hop Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-1">
                {/* URL Input */}
                <div className="md:col-span-6">
                  <label className="text-[10px] font-bold mono uppercase text-[#141414] block mb-1">TARGET URL</label>
                  <input
                    type="text"
                    value={hop.url}
                    onChange={(e) => handleHopChange(index, 'url', e.target.value)}
                    placeholder="https://example.com/page"
                    className="w-full bg-white border border-[#141414] focus:border-[#F27D26] px-2.5 py-1.5 text-[#141414] font-mono focus:outline-none"
                  />
                </div>

                {/* Status Code Select / Input */}
                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold mono uppercase text-[#141414] block mb-1">HTTP STATUS</label>
                  <select
                    value={hop.statusCode || 200}
                    onChange={(e) => handleHopChange(index, 'statusCode', e.target.value)}
                    className="w-full bg-white border border-[#141414] focus:border-[#F27D26] px-2.5 py-1.5 text-[#141414] font-mono focus:outline-none"
                  >
                    <option value={200}>200 OK (Final Target)</option>
                    <option value={301}>301 Permanent Redirect</option>
                    <option value={302}>302 Found / Temporary</option>
                    <option value={303}>303 See Other</option>
                    <option value={307}>307 Temporary (Preserve Method)</option>
                    <option value={308}>308 Permanent (Preserve Method)</option>
                    <option value={404}>404 Not Found</option>
                    <option value={500}>500 Internal Server Error</option>
                  </select>
                </div>

                {/* Optional Note */}
                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold mono uppercase text-[#141414] block mb-1">CONTEXT NOTE</label>
                  <input
                    type="text"
                    value={hop.note || ''}
                    onChange={(e) => handleHopChange(index, 'note', e.target.value)}
                    placeholder="e.g. legacy campaign link"
                    className="w-full bg-white border border-[#141414] focus:border-[#F27D26] px-2.5 py-1.5 text-[#141414] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

