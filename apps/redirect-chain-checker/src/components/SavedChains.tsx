import React from 'react';
import { ChainAnalysis } from '../types';
import { ChainVisualizer } from './ChainVisualizer';
import { Bookmark, Trash2, Calendar, Layers } from 'lucide-react';

interface SavedChainsProps {
  savedChains: ChainAnalysis[];
  onDeleteChain: (id: string) => void;
  onClearAll: () => void;
  onSelectChain: (analysis: ChainAnalysis) => void;
}

export const SavedChains: React.FC<SavedChainsProps> = ({
  savedChains,
  onDeleteChain,
  onClearAll,
  onSelectChain,
}) => {
  return (
    <div className="bg-white border border-[#141414] p-5 tech-shadow space-y-4 text-[#141414]">
      <div className="flex items-center justify-between flex-wrap gap-4 pb-3 border-b border-[#141414]">
        <div>
          <span className="col-header block">PERSISTED AUDIT LOGS</span>
          <h2 className="text-base font-black uppercase text-[#141414] flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#F27D26]" />
            Saved Analysis History ({savedChains.length})
          </h2>
        </div>

        {savedChains.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white border border-[#141414] text-xs font-mono uppercase font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR HISTORY</span>
          </button>
        )}
      </div>

      {savedChains.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-[#141414] bg-[#E4E3E0] text-[#141414] text-xs font-mono">
          <Bookmark className="w-8 h-8 text-[#141414] mx-auto mb-2 opacity-50" />
          <p className="font-bold uppercase">NO SAVED REDIRECT AUDITS YET</p>
          <p className="mt-1 opacity-70">
            Click "SAVE AUDIT" while inspecting any chain in the Single Analyzer tab to store it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedChains.map((chain) => (
            <div key={chain.id} className="bg-[#E4E3E0] border border-[#141414] p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#141414] text-xs font-mono">
                <div>
                  <h3 className="font-black text-[#141414] text-sm uppercase">{chain.title}</h3>
                  <div className="flex items-center gap-3 text-[#141414] text-[11px] mt-0.5 opacity-80 font-bold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#F27D26]" />
                      {new Date(chain.createdAt).toLocaleDateString()} AT {new Date(chain.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#F27D26]" />
                      {chain.totalHops} HOPS ({chain.totalRedirects} REDIRECTS)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectChain(chain)}
                    className="px-3 py-1.5 bg-[#141414] hover:bg-[#F27D26] text-white font-bold uppercase transition-colors text-xs tech-shadow-sm"
                  >
                    OPEN IN ANALYZER
                  </button>
                  <button
                    onClick={() => onDeleteChain(chain.id)}
                    className="p-1.5 bg-white text-[#141414] hover:bg-red-600 hover:text-white border border-[#141414] transition-colors"
                    title="Delete Saved Chain"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <ChainVisualizer analysis={chain} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

