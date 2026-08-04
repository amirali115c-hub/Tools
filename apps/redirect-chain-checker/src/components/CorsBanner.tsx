import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, Terminal, Globe } from 'lucide-react';

export const CorsBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[#141414] text-white border border-[#141414] p-3 mb-6 tech-shadow">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="mono text-xs font-bold bg-white text-black px-1.5 py-0.5 shrink-0">
            ! SECURITY
          </span>
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-200">
            CORS Security Boundary: Browsers restrict cross-origin discovery. Use Manual or Curl Header mode for full hop details.
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase text-white hover:text-[#F27D26] border border-slate-700 bg-slate-900 transition-colors shrink-0"
        >
          {isExpanded ? (
            <>
              <span>Collapse</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Modes Info</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-black p-3 border border-slate-800">
          <div className="p-2.5 border border-slate-800 bg-slate-950">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1 mono text-xs uppercase">
              <Terminal className="w-3.5 h-3.5" />
              <span>1. Curl Header Parser</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Paste raw output from <code className="text-emerald-300 font-mono bg-slate-900 px-1">curl -IL &lt;url&gt;</code>. Client-side engine parses status codes, Location headers, and server details.
            </p>
          </div>

          <div className="p-2.5 border border-slate-800 bg-slate-950">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1 mono text-xs uppercase">
              <Globe className="w-3.5 h-3.5" />
              <span>2. Manual Chain Builder</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Step-by-step interactive hop editor. Add custom URLs, HTTP status codes (301, 302, 307, 308, 200), and context notes.
            </p>
          </div>

          <div className="p-2.5 border border-slate-800 bg-slate-950">
            <div className="flex items-center gap-1.5 text-[#F27D26] font-bold mb-1 mono text-xs uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>3. Best-Effort Fetch</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Attempts browser fetch with <code className="text-amber-300 font-mono bg-slate-900 px-1">redirect:'manual'</code>. Detects opaque redirect boundaries without fabricating status codes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

