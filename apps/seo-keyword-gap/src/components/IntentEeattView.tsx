import React, { useState } from 'react';
import { ClassifiedPage, GapOpportunity } from '../types';
import { calculateSerpIntentDistribution, auditEeattQuality, generateComprehensiveBrief } from '../utils/intentEeattEngine';
import { Compass, Award, FileText, CheckCircle2, AlertCircle, Copy, Check, Download, Layers, Sparkles, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import Papa from 'papaparse';

interface IntentEeattViewProps {
  competitorPages: ClassifiedPage[];
  ownPages: ClassifiedPage[];
  gaps: GapOpportunity[];
}

export const IntentEeattView: React.FC<IntentEeattViewProps> = ({
  competitorPages,
  ownPages,
  gaps
}) => {
  const allPages = [...ownPages, ...competitorPages];
  const intentDist = calculateSerpIntentDistribution(allPages);

  const [selectedPageUrl, setSelectedPageUrl] = useState<string>(ownPages[0]?.metadata.url || competitorPages[0]?.metadata.url || '');
  const activePage = allPages.find(p => p.metadata.url === selectedPageUrl) || allPages[0];

  const eeattAudit = activePage ? auditEeattQuality(activePage) : null;

  // Brief Generator for Gap Opportunities
  const [selectedGapId, setSelectedGapId] = useState<string>(gaps[0]?.id || '');
  const activeGap = gaps.find(g => g.id === selectedGapId) || gaps[0];
  const activeBrief = activeGap ? generateComprehensiveBrief(activeGap) : null;

  const [copiedBrief, setCopiedBrief] = useState(false);

  const handleCopyBriefMarkdown = () => {
    if (!activeBrief) return;

    const md = `# Content Brief: ${activeBrief.title}
**Target Slug:** /services/${activeBrief.targetSlug}
**Primary Keyword:** ${activeBrief.primaryKeyword}
**Search Intent:** ${activeBrief.intent}
**Suggested Word Count:** ${activeBrief.suggestedWordCount.min} - ${activeBrief.suggestedWordCount.max} words

## Secondary Keywords
${activeBrief.secondaryKeywords.map(k => `- ${k}`).join('\n')}

## Target Entities to Mention
${activeBrief.targetEntities.map(e => `- ${e}`).join('\n')}

## Recommended Outline
${activeBrief.outline.map(o => `### ${o.headingType}: ${o.text}\n*Guidance:* ${o.guidance}`).join('\n\n')}

## E-E-A-T Quality Requirements
${activeBrief.eeattRequirements.map(r => `- ${r}`).join('\n')}

## JSON-LD Schema Markup
\`\`\`json
${JSON.stringify(activeBrief.schemaMarkup, null, 2)}
\`\`\`
`;

    navigator.clipboard.writeText(md);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" /> Milestone 4 • SERP Intent & E-E-A-T Optimizer
            </span>
            <span className="text-xs text-slate-400">Content Quality & Intent Matching</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            Search Intent Deconstruction & E-E-A-T Quality Audit
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Analyze user search intent, evaluate Google’s E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) quality signals, and build rich copywriter briefs.
          </p>
        </div>
      </div>

      {/* 1. SERP Search Intent Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              Search Intent Profile Across Analyzed Pages
            </h3>
            <p className="text-xs text-slate-500">
              Distribution of intent types across primary and secondary keywords
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {intentDist.map(item => (
            <div key={item.intent} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{item.intent}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: item.color }}>
                  {item.percentage}%
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900">{item.count} <span className="text-xs font-normal text-slate-500">pages</span></div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. E-E-A-T Quality Audit Card */}
      {eeattAudit && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                E-E-A-T Quality Health Audit
              </h3>
              <p className="text-xs text-slate-500">
                Auditing Experience, Expertise, Authoritativeness, and Trustworthiness
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-semibold">Select Page:</label>
              <select
                value={selectedPageUrl}
                onChange={e => setSelectedPageUrl(e.target.value)}
                className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 font-bold max-w-xs truncate outline-none"
              >
                {allPages.map((p, idx) => (
                  <option key={idx} value={p.metadata.url}>
                    {p.metadata.title || p.metadata.url}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col justify-center items-center text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Overall E-E-A-T Score</span>
              <div className="text-3xl font-extrabold text-amber-400 my-1">{eeattAudit.overallScore}%</div>
              <span className="text-[10px] text-slate-300">Google Quality Rater Level</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Experience</span>
              <div className="text-lg font-bold text-slate-900">{eeattAudit.experienceScore}%</div>
              <p className="text-[10px] text-slate-500">Case studies & first-hand metrics</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Expertise</span>
              <div className="text-lg font-bold text-slate-900">{eeattAudit.expertiseScore}%</div>
              <p className="text-[10px] text-slate-500">Author bio & credentials</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Trustworthiness</span>
              <div className="text-lg font-bold text-slate-900">{eeattAudit.trustworthinessScore}%</div>
              <p className="text-[10px] text-slate-500">Contact, pricing & policy trust</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">E-E-A-T Signal Recommendations:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {eeattAudit.signals.map((sig, idx) => (
                <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{sig.signalName}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      sig.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {sig.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{sig.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Interactive Copywriter Content Brief Generator */}
      {gaps.length > 0 && activeBrief && (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Copywriter Brief Builder for Content Gaps
              </h3>
              <p className="text-xs text-slate-400">
                Ready-to-use structural content brief with target keywords, H1/H2/H3 outline, entities, and schema
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold">Select Gap Opportunity:</label>
              <select
                value={selectedGapId}
                onChange={e => setSelectedGapId(e.target.value)}
                className="text-xs border border-slate-700 bg-slate-800 text-white rounded-xl px-3 py-1.5 font-bold max-w-xs truncate outline-none"
              >
                {gaps.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.workingTitle} ({g.targetPrimaryKeyword})
                  </option>
                ))}
              </select>

              <button
                onClick={handleCopyBriefMarkdown}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
              >
                {copiedBrief ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedBrief ? 'Copied Brief!' : 'Copy Brief (Markdown)'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            <div className="lg:col-span-7 space-y-3">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Target Article Title (H1)</span>
                <div className="text-sm font-bold text-white">{activeBrief.title}</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Slug: /services/{activeBrief.targetSlug} • Target Word Count: {activeBrief.suggestedWordCount.min} - {activeBrief.suggestedWordCount.max} words
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">Recommended Article Outline:</span>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {activeBrief.outline.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                          {item.headingType}
                        </span>
                        <strong className="text-white text-xs">{item.text}</strong>
                      </div>
                      <p className="text-[11px] text-slate-400 pl-8">{item.guidance}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">Target Entity Terms:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeBrief.targetEntities.map((ent, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-900 border border-slate-700 text-amber-300 text-[11px] font-semibold rounded-md">
                      {ent}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">E-E-A-T Writer Requirements:</span>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  {activeBrief.eeattRequirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
