import React, { useState } from 'react';
import { ClassifiedPage, ExtractedEntity } from '../types';
import { extractEntities, generateSchemaMarkup } from '../utils/entityExtractor';
import { Code2, Check, Copy, AlertTriangle, Cpu, Tag, Sparkles, ExternalLink, Globe, Shield, BookOpen } from 'lucide-react';

interface EntitySchemaViewProps {
  competitorPages: ClassifiedPage[];
  ownPages: ClassifiedPage[];
}

export const EntitySchemaView: React.FC<EntitySchemaViewProps> = ({
  competitorPages,
  ownPages
}) => {
  const entities = extractEntities(competitorPages, ownPages);
  const [selectedEntityCategory, setSelectedEntityCategory] = useState<string>('all');
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Schema Generator State
  const [schemaPageTitle, setSchemaPageTitle] = useState('B2B SaaS Lead Generation & Enterprise SEO');
  const [schemaCategory, setSchemaCategory] = useState<'service' | 'blog'>('service');
  const [schemaPrimaryKeyword, setSchemaPrimaryKeyword] = useState('B2B SaaS SEO');

  const generatedSchema = generateSchemaMarkup(
    schemaPageTitle,
    'https://example.com/services/b2b-saas-seo',
    schemaCategory,
    schemaPrimaryKeyword,
    entities.slice(0, 5).map(e => e.entityName)
  );

  const handleCopySchema = () => {
    navigator.clipboard.writeText(generatedSchema.formattedJson);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const filteredEntities = entities.filter(e => {
    if (selectedEntityCategory === 'all') return true;
    if (selectedEntityCategory === 'missing') return e.isMissingInOwnSite;
    return e.category === selectedEntityCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Cpu className="w-3 h-3 text-purple-400" /> Milestone 2 • Entity & Knowledge Graph Engine
            </span>
            <span className="text-xs text-slate-400">NER & Structured Data</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            Named Entity Matrix & 1-Click JSON-LD Schema
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Google’s Knowledge Graph relies on entities rather than plain keywords. Extract named entities, identify missing E-E-A-T signals, and generate valid schema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Extracted Entities Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Entity Advantage Matrix ({entities.length})
            </h3>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedEntityCategory('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedEntityCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Entities
              </button>
              <button
                onClick={() => setSelectedEntityCategory('missing')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  selectedEntityCategory === 'missing' ? 'bg-amber-600 text-white' : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Missing on Your Site
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {filteredEntities.map((e) => (
              <div key={e.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                      {e.isMissingInOwnSite && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Missing Entity Advantage
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mt-1.5">
                      {e.entityName}
                    </h4>
                  </div>

                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                    Relevance: {e.relevanceScore}/100
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs bg-slate-100/60 p-2 rounded-lg">
                  <div>
                    Competitor Mentions: <strong className="text-indigo-600">{e.competitorMentions}</strong>
                  </div>
                  <div>
                    Your Mentions: <strong className={e.ownMentions > 0 ? 'text-emerald-600' : 'text-slate-400'}>{e.ownMentions}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Live JSON-LD Schema Generator */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                1-Click JSON-LD Schema Generator
              </h3>
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded uppercase">
                {generatedSchema.schemaType} Schema
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Page Title</label>
                <input
                  type="text"
                  value={schemaPageTitle}
                  onChange={e => setSchemaPageTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Page Type</label>
                  <select
                    value={schemaCategory}
                    onChange={e => setSchemaCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                  >
                    <option value="service">Service Page</option>
                    <option value="blog">Article / Guide</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Primary Keyword</label>
                  <input
                    type="text"
                    value={schemaPrimaryKeyword}
                    onChange={e => setSchemaPrimaryKeyword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Generated Code View */}
            <div className="mt-4 relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64">
              <pre>{generatedSchema.formattedJson}</pre>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopySchema}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {copiedSchema ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copiedSchema ? 'Copied JSON-LD!' : 'Copy Schema Code'}
            </button>

            <a
              href="https://validator.schema.org/"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 shrink-0"
              title="Validate on Google Schema Testing Tool"
            >
              Test <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>

    </div>
  );
};
