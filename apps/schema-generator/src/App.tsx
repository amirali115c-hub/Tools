import {useState, useCallback} from 'react';
import {Copy, Check, Code2, Eye, ChevronDown, ChevronRight, Download, RotateCcw, Code} from 'lucide-react';
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
  }, []);

  const updateField = useCallback((name: string, value: string) => {
    setFormData((prev) => ({...prev, [name]: value}));
  }, []);

  const updateRepeaterItem = useCallback((fieldName: string, index: number, subField: string, value: string) => {
    setFormData((prev) => {
      let items: Array<Record<string, string>> = [];
      try {
        items = JSON.parse(prev[fieldName] || '[]');
      } catch {
        items = [];
      }
      while (items.length <= index) items.push({});
      items[index] = {...items[index], [subField]: value};
      return {...prev, [fieldName]: JSON.stringify(items, null, 2)};
    });
  }, []);

  const addRepeaterItem = useCallback((fieldName: string) => {
    setFormData((prev) => {
      let items: Array<Record<string, string>> = [];
      try {
        items = JSON.parse(prev[fieldName] || '[]');
      } catch {
        items = [];
      }
      items.push({});
      return {...prev, [fieldName]: JSON.stringify(items, null, 2)};
    });
  }, []);

  const removeRepeaterItem = useCallback((fieldName: string, index: number) => {
    setFormData((prev) => {
      let items: Array<Record<string, string>> = [];
      try {
        items = JSON.parse(prev[fieldName] || '[]');
      } catch {
        items = [];
      }
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

  const handleReset = useCallback(() => {
    setFormData({});
    setGeneratedJson('');
    setShowPreview(false);
  }, []);

  const getHtmlSnippet = useCallback(() => {
    if (!generatedJson) return '';
    return `<script type="application/ld+json">\n${generatedJson}\n</script>`;
  }, [generatedJson]);

  const renderRepeater = (field: typeof template.fields[0]) => {
    let items: Array<Record<string, string>> = [];
    try {
      items = JSON.parse(formData[field.name] || '[]');
    } catch {
      items = [];
    }

    return (
      <div key={field.name} className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">{field.label}</label>
        {items.map((item, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">Item {idx + 1}</span>
              <button
                onClick={() => removeRepeaterItem(field.name, idx)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </div>
            {field.fields!.map((sub) => (
              <div key={sub.name}>
                <label className="block text-xs text-gray-500 mb-1">{sub.label}</label>
                {sub.type === 'textarea' ? (
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={sub.placeholder}
                    value={item[sub.name] || ''}
                    onChange={(e) => updateRepeaterItem(field.name, idx, sub.name, e.target.value)}
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={sub.placeholder}
                    value={item[sub.name] || ''}
                    onChange={(e) => updateRepeaterItem(field.name, idx, sub.name, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
        <button
          onClick={() => addRepeaterItem(field.name)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          + Add {field.label.replace(/s$/, '')}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Code2 className="w-4 h-4" />
            Free Schema Markup Generator
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Free Schema Markup Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate valid JSON-LD structured data for Google rich results. Pick a type, fill in the fields, copy the code.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Type Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Schema Type</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SCHEMA_TEMPLATES.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => handleTypeChange(t.type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedType === t.type
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-gray-500">{template.description}</p>
            </div>

            {/* Fields */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fill in Details</h2>
              <div className="space-y-4">
                {template.fields.map((field) => {
                  if (field.type === 'repeater') return renderRepeater(field);
                  return (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder={field.placeholder}
                          value={formData[field.name] || ''}
                          onChange={(e) => updateField(field.name, e.target.value)}
                          rows={3}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          value={formData[field.name] || ''}
                          onChange={(e) => updateField(field.name, e.target.value)}
                        >
                          <option value="">Select...</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder={field.placeholder}
                          value={formData[field.name] || ''}
                          onChange={(e) => updateField(field.name, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleGenerate}
                  className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Code2 className="w-4 h-4" />
                  Generate Schema
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  title="Reset form"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Output */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Generated JSON-LD</h2>
                {generatedJson && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              {generatedJson ? (
                <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-[500px]">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{generatedJson}</pre>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <Code2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Fill in the form and click "Generate Schema" to see the JSON-LD output</p>
                </div>
              )}
            </div>

            {/* HTML Snippet */}
            {generatedJson && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    HTML Snippet
                  </h2>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getHtmlSnippet());
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy HTML
                  </button>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-[200px]">
                  <pre className="text-sm text-yellow-300 font-mono whitespace-pre-wrap">{getHtmlSnippet()}</pre>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Add this code to the &lt;head&gt; section of your HTML page
                </p>
              </div>
            )}

            {/* Tips */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
              <h3 className="font-semibold text-indigo-900 mb-2">Schema Markup Tips</h3>
              <ul className="text-sm text-indigo-800 space-y-1.5">
                <li>• Use Google's Rich Results Test to validate your schema</li>
                <li>• Only include properties that have values</li>
                <li>• Keep descriptions under 160 characters for best results</li>
                <li>• Update schema when page content changes</li>
                <li>• Multiple schema types can be used on one page</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Schema Types Guide */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Schema Types & When to Use Them</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCHEMA_TEMPLATES.map((t) => (
              <div key={t.type} className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{t.label}</h3>
                <p className="text-sm text-gray-600">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
