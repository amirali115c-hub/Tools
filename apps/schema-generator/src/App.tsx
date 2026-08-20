import {useState, useCallback} from 'react';
import {Copy, Check, Code2, RotateCcw, ChevronDown, ChevronRight, Download, Layers} from 'lucide-react';
import {SchemaType} from './types';
import {SCHEMA_TEMPLATES} from './data/templates';
import {generateSchema} from './utils/schema-generator';

function App() {
  const [selectedType, setSelectedType] = useState<SchemaType>('Organization');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedJson, setGeneratedJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const template = SCHEMA_TEMPLATES.find((t) => t.type === selectedType)!;

  const handleTypeChange = useCallback((type: SchemaType) => {
    setSelectedType(type);
    setFormData({});
    setGeneratedJson('');
    setShowPreview(false);
  }, []);

  const updateField = useCallback((name: string, value: string) => {
    setFormData((prev) => ({...prev, [name]: value}));
  }, []);

  const updateRepeaterItem = useCallback((fieldName: string, index: number, subField: string, value: string) => {
    setFormData((prev) => {
      let items: Array<Record<string, string>> = [];
      try { items = JSON.parse(prev[fieldName] || '[]'); } catch { items = []; }
      while (items.length <= index) items.push({});
      items[index] = {...items[index], [subField]: value};
      return {...prev, [fieldName]: JSON.stringify(items, null, 2)};
    });
  }, []);

  const addRepeaterItem = useCallback((fieldName: string) => {
    setFormData((prev) => {
      let items: Array<Record<string, string>> = [];
      try { items = JSON.parse(prev[fieldName] || '[]'); } catch { items = []; }
      items.push({});
      return {...prev, [fieldName]: JSON.stringify(items, null, 2)};
    });
  }, []);

  const removeRepeaterItem = useCallback((fieldName: string, index: number) => {
    setFormData((prev) => {
      let items: Array<Record<string, string>> = [];
      try { items = JSON.parse(prev[fieldName] || '[]'); } catch { items = []; }
      items.splice(index, 1);
      return {...prev, [fieldName]: JSON.stringify(items, null, 2)};
    });
  }, []);

  const handleGenerate = useCallback(() => {
    const json = generateSchema(selectedType, formData);
    setGeneratedJson(json);
    setShowPreview(true);
  }, [selectedType, formData]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedJson]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([generatedJson], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedType.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}-schema.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedJson, selectedType]);

  const htmlSnippet = generatedJson ? `<script type="application/ld+json">\n${generatedJson}\n</script>` : '';

  const renderRepeater = (field: typeof template.fields[0]) => {
    let items: Array<Record<string, string>> = [];
    try { items = JSON.parse(formData[field.name] || '[]'); } catch { items = []; }

    return (
      <div key={field.name} className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">{field.label}</label>
        {items.map((item, idx) => (
          <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Item {idx + 1}</span>
              <button onClick={() => removeRepeaterItem(field.name, idx)} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
            </div>
            {field.fields!.map((sub) => (
              <div key={sub.name}>
                <label className="block text-xs text-slate-500 mb-1">{sub.label}</label>
                {sub.type === 'textarea' ? (
                  <textarea className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600" placeholder={sub.placeholder} value={item[sub.name] || ''} onChange={(e) => updateRepeaterItem(field.name, idx, sub.name, e.target.value)} rows={3} />
                ) : (
                  <input type="text" className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600" placeholder={sub.placeholder} value={item[sub.name] || ''} onChange={(e) => updateRepeaterItem(field.name, idx, sub.name, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        ))}
        <button onClick={() => addRepeaterItem(field.name)} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">+ Add {field.label.replace(/s$/, '')}</button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Hero Section */}
      <div className="tool-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Free SEO Tool
          </div>
          <h1>Free Schema Markup Generator — JSON-LD Structured Data</h1>
          <p className="subtitle">Generate valid JSON-LD structured data for Google rich results. 15+ schema types including Organization, Product, FAQ, HowTo.</p>
          <div className="hero-trust">
            <span className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
              No uploads
            </span>
            <span className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
              No sign-ups
            </span>
            <span className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              100% private
            </span>
            <span className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Instant results
            </span>
            <span className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Free forever
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-5">
            {/* Type Selector */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Schema Type</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SCHEMA_TEMPLATES.map((t) => (
                  <button key={t.type} onClick={() => handleTypeChange(t.type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedType === t.type ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">{template.description}</p>
            </div>

            {/* Fields */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Properties</h2>
              <div className="space-y-4">
                {template.fields.map((field) => {
                  if (field.type === 'repeater') return renderRepeater(field);
                  return (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600 transition-colors" placeholder={field.placeholder} value={formData[field.name] || ''} onChange={(e) => updateField(field.name, e.target.value)} rows={3} />
                      ) : field.type === 'select' ? (
                        <select className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" value={formData[field.name] || ''} onChange={(e) => updateField(field.name, e.target.value)}>
                          <option value="" className="bg-slate-900">Select...</option>
                          {field.options?.map((opt) => (<option key={opt} value={opt} className="bg-slate-900">{opt}</option>))}
                        </select>
                      ) : (
                        <input type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'} className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600 transition-colors" placeholder={field.placeholder} value={formData[field.name] || ''} onChange={(e) => updateField(field.name, e.target.value)} />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleGenerate} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
                  <Code2 className="w-4 h-4" />
                  Generate Schema
                </button>
                <button onClick={() => {setFormData({}); setGeneratedJson(''); setShowPreview(false);}} className="px-4 py-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-slate-200 transition-all" title="Reset">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Output */}
          <div className="space-y-5">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Generated JSON-LD</h2>
                {generatedJson && (
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-medium hover:bg-slate-700 hover:text-slate-200 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              {generatedJson ? (
                <div className="bg-slate-950 rounded-xl p-4 overflow-auto max-h-[500px] border border-slate-800">
                  <pre className="text-sm text-emerald-400 font-mono whitespace-pre-wrap">{generatedJson}</pre>
                </div>
              ) : (
                <div className="bg-slate-950/50 border-2 border-dashed border-slate-800 rounded-xl p-8 text-center">
                  <Code2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Fill in the form and click Generate to see output</p>
                </div>
              )}
            </div>

            {/* HTML Snippet */}
            {generatedJson && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">HTML Snippet</h2>
                  <button onClick={() => {navigator.clipboard.writeText(htmlSnippet); setCopied(true); setTimeout(() => setCopied(false), 2000);}}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Copy HTML
                  </button>
                </div>
                <div className="bg-slate-950 rounded-xl p-4 overflow-auto max-h-[150px] border border-slate-800">
                  <pre className="text-sm text-amber-400 font-mono whitespace-pre-wrap">{htmlSnippet}</pre>
                </div>
                <p className="mt-2 text-xs text-slate-600">Add this to the &lt;head&gt; section of your HTML page</p>
              </div>
            )}

            {/* Tips */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5">
              <h3 className="font-semibold text-indigo-400 text-sm mb-2">Quick Tips</h3>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li>• Validate with Google's Rich Results Test</li>
                <li>• Only include properties that have values</li>
                <li>• Keep descriptions under 160 characters</li>
                <li>• Multiple schema types can be used on one page</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          Schema Markup Generator — 15+ Types — JSON-LD Output — Google Rich Results Ready
        </div>
      </footer>
    </div>
  );
}

export default App;
