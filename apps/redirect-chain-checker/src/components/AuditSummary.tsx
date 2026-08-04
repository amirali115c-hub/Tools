import React, { useState } from 'react';
import { AuditFlag, FlagSeverity } from '../types';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
} from 'lucide-react';

interface AuditSummaryProps {
  flags: AuditFlag[];
}

export const AuditSummary: React.FC<AuditSummaryProps> = ({ flags }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const criticals = flags.filter(f => f.severity === 'critical');
  const warnings = flags.filter(f => f.severity === 'warning');
  const successes = flags.filter(f => f.severity === 'success');

  const filteredFlags = flags.filter(f => {
    if (filterCategory === 'all') return true;
    return f.category === filterCategory;
  });

  const getSeverityIcon = (severity: FlagSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
  };

  const getSeverityCardStyle = (severity: FlagSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-300 text-red-950';
      case 'warning':
        return 'bg-amber-50 border-amber-300 text-amber-950';
      case 'info':
        return 'bg-blue-50 border-blue-300 text-blue-950';
      case 'success':
        return 'bg-emerald-50 border-emerald-300 text-emerald-950';
    }
  };

  const getCategoryBadge = (category: AuditFlag['category']) => {
    switch (category) {
      case 'seo':
        return (
          <span className="mono text-[10px] px-1.5 py-0.5 font-bold uppercase bg-[#141414] text-white">
            SEO
          </span>
        );
      case 'security':
        return (
          <span className="mono text-[10px] px-1.5 py-0.5 font-bold uppercase bg-red-600 text-white">
            SECURITY
          </span>
        );
      case 'performance':
        return (
          <span className="mono text-[10px] px-1.5 py-0.5 font-bold uppercase bg-[#F27D26] text-white">
            PERFORMANCE
          </span>
        );
      case 'architecture':
        return (
          <span className="mono text-[10px] px-1.5 py-0.5 font-bold uppercase bg-blue-700 text-white">
            ARCHITECTURE
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#141414] p-5 tech-shadow">
      {/* Title & Stat Summary Badges */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 mb-5 border-b border-[#141414]">
        <div>
          <span className="col-header block">SYSTEM DIAGNOSTICS</span>
          <h3 className="text-base font-black text-[#141414] uppercase tracking-tight flex items-center gap-2">
            Audit Findings &amp; Action Directives
          </h3>
        </div>

        {/* Severity Count Indicators */}
        <div className="flex items-center gap-2 flex-wrap text-xs mono font-bold">
          <div className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-400 flex items-center gap-1.5">
            <span>{criticals.length} CRITICAL</span>
          </div>
          <div className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-400 flex items-center gap-1.5">
            <span>{warnings.length} WARNINGS</span>
          </div>
          <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-400 flex items-center gap-1.5">
            <span>{successes.length} PASSED</span>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs uppercase font-bold custom-scrollbar">
        {[
          { id: 'all', label: `ALL (${flags.length})` },
          { id: 'seo', label: 'SEO & CRAWLING' },
          { id: 'security', label: 'SECURITY' },
          { id: 'performance', label: 'PERFORMANCE' },
          { id: 'architecture', label: 'ARCHITECTURE' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3 py-1 border border-[#141414] transition-all whitespace-nowrap ${
              filterCategory === tab.id
                ? 'bg-[#141414] text-white tech-shadow-sm'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Flag List */}
      {filteredFlags.length === 0 ? (
        <div className="p-8 text-center bg-[#E4E3E0] border border-[#141414] text-[#141414] text-xs font-semibold uppercase">
          NO DIAGNOSTIC FLAGS MATCH THIS CATEGORY.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFlags.map(flag => (
            <div
              key={flag.id}
              className={`p-4 border border-[#141414] ${getSeverityCardStyle(flag.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(flag.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="text-sm font-bold uppercase text-[#141414] tracking-tight">{flag.title}</h4>
                    {getCategoryBadge(flag.category)}
                  </div>

                  <p className="text-xs text-[#141414] mt-1 leading-relaxed font-medium">
                    {flag.description}
                  </p>

                  <div className="mt-3 p-3 bg-white border border-[#141414] text-xs">
                    <span className="mono text-[11px] font-bold block mb-1 uppercase text-[#F27D26]">
                      &gt; RECOMMENDATION DIRECTIVE:
                    </span>
                    <span className="text-[#141414] leading-relaxed block font-normal">
                      {flag.recommendation}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

