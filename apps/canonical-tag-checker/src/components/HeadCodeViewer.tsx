import React, { useState } from 'react';
import { ParsedPageData } from '../types';
import { Code, Copy, Check } from 'lucide-react';

interface HeadCodeViewerProps {
  parsedData: ParsedPageData;
}

export const HeadCodeViewer: React.FC<HeadCodeViewerProps> = ({ parsedData }) => {
  const [copied, setCopied] = useState(false);

  // Extract clean snippet containing head canonicals, meta robots, hreflang, pagination
  const headElements: string[] = [];

  if (parsedData.title && parsedData.title !== 'No Title Tag Found') {
    headElements.push(`<title>${parsedData.title}</title>`);
  }

  parsedData.headCanonicalTags.forEach((t) => headElements.push(t.raw));
  parsedData.bodyCanonicalTags.forEach((t) => headElements.push(`<!-- PLACED IN BODY INVALIDLY -->\n${t.raw}`));

  if (parsedData.metaRobots.length > 0) {
    headElements.push(`<meta name="robots" content="${parsedData.metaRobots.join(', ')}">`);
  }

  parsedData.hreflangTags.forEach((h) => headElements.push(h.raw));

  if (parsedData.pagination.relNext) {
    headElements.push(`<link rel="next" href="${parsedData.pagination.relNext}">`);
  }
  if (parsedData.pagination.relPrev) {
    headElements.push(`<link rel="prev" href="${parsedData.pagination.relPrev}">`);
  }

  const snippet = headElements.length > 0 ? headElements.join('\n') : '<!-- No canonical or relevant SEO tags found in document -->';

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-4 border-slate-900 bg-slate-900 text-white p-5 shadow-md space-y-3">
      <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
          <h4 className="text-sm font-black uppercase tracking-wider text-white">Extracted SEO Head Elements</h4>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-black uppercase text-slate-100 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />
              <span>Copy Head Code</span>
            </>
          )}
        </button>
      </div>

      <pre className="text-xs font-mono font-bold text-emerald-300 overflow-x-auto p-4 border-2 border-slate-800 bg-slate-950 leading-relaxed whitespace-pre-wrap break-all shadow-xs">
        <code>{snippet}</code>
      </pre>
    </div>
  );
};

