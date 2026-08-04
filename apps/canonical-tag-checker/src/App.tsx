import React, { useState } from 'react';
import { Header } from './components/Header';
import { SinglePageAudit } from './components/SinglePageAudit';
import { BulkAudit } from './components/BulkAudit';
import { BookOpen, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectPreset={() => {}}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {activeTab === 'single' ? <SinglePageAudit /> : <BulkAudit />}

        {/* Educational SEO Canonical Cheat Sheet */}
        <section className="bg-white border-4 border-slate-900 p-6 sm:p-8 space-y-4 shadow-md">
          <div className="flex items-center gap-2.5 border-b-2 border-slate-900 pb-3">
            <BookOpen className="w-6 h-6 text-slate-900 stroke-[2.5]" />
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
              Canonicalization Best Practices & SEO Cheat Sheet
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 border-2 border-slate-900 bg-slate-50 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-black uppercase tracking-wide text-slate-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                <span>Healthy Default State</span>
              </div>
              <p className="text-slate-700 font-semibold leading-relaxed">
                Always include a <strong>self-referencing canonical</strong> using a clean, absolute URL on every standard indexable page to prevent duplicate parameters from splitting link equity.
              </p>
            </div>

            <div className="p-4 border-2 border-slate-900 bg-slate-50 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-black uppercase tracking-wide text-slate-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                <span>Avoid Canonical Chains</span>
              </div>
              <p className="text-slate-700 font-semibold leading-relaxed">
                Never point Page A canonical to Page B if Page B canonicalizes to Page C. Search engines truncate canonical chains and may ignore the hint entirely.
              </p>
            </div>

            <div className="p-4 border-2 border-slate-900 bg-slate-50 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-black uppercase tracking-wide text-slate-900">
                <ShieldCheck className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
                <span>hreflang & Pagination</span>
              </div>
              <p className="text-slate-700 font-semibold leading-relaxed">
                Ensure regional <strong>hreflang variants</strong> and <strong>paginated pages (?page=2)</strong> canonicalize to themselves — never point all localized or paginated pages to Page 1 or master locale!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-slate-900 bg-white py-6 text-center text-xs font-bold uppercase tracking-wider text-slate-700">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Canonical Tag Checker • Client-Side Technical SEO Diagnostics</span>
          <span>Built for SEO Audits, Agencies & E-commerce Site Managers</span>
        </div>
      </footer>
    </div>
  );
}

