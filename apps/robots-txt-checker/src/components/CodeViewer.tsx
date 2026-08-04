import React from 'react';
import { DiagnosticIssue, ParsedLine } from '../types';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface CodeViewerProps {
  rawText: string;
  onTextChange?: (text: string) => void;
  parsedLines: ParsedLine[];
  diagnostics: DiagnosticIssue[];
  highlightedLineNumber?: number | null;
  readOnly?: boolean;
  byteSize?: number;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  rawText,
  onTextChange,
  parsedLines,
  diagnostics,
  highlightedLineNumber,
  readOnly = false,
  byteSize,
}) => {
  // Map line numbers to highest severity diagnostic
  const lineDiagnosticMap = new Map<number, DiagnosticIssue>();

  diagnostics.forEach((issue) => {
    if (issue.lineNumber) {
      const existing = lineDiagnosticMap.get(issue.lineNumber);
      if (!existing) {
        lineDiagnosticMap.set(issue.lineNumber, issue);
      } else {
        // Critical > Warning > Syntax > Notice
        const severityRank = { critical: 4, warning: 3, syntax: 2, notice: 1 };
        if (severityRank[issue.severity] > severityRank[existing.severity]) {
          lineDiagnosticMap.set(issue.lineNumber, issue);
        }
      }
    }
  });

  const lines = rawText.split(/\r?\n/);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full shadow-lg">
      {/* Editor Header Bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="font-semibold text-slate-300 ml-2">robots.txt</span>
        </div>

        <div className="flex items-center space-x-4">
          <span>
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
          {byteSize !== undefined && (
            <span
              className={
                byteSize > 512000
                  ? 'text-rose-400 font-bold'
                  : 'text-slate-400'
              }
            >
              {(byteSize / 1024).toFixed(1)} KiB
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans text-[11px]">
            {readOnly ? 'Preview' : 'Editable'}
          </span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 min-h-[360px] max-h-[560px] overflow-auto bg-slate-950 font-mono text-xs leading-relaxed text-slate-200">
        {!readOnly ? (
          <div className="relative flex min-h-full">
            {/* Line Gutter */}
            <div className="select-none bg-slate-900/60 border-r border-slate-800/80 py-3 px-2 text-right text-slate-500 font-mono text-xs min-w-[3.5rem] space-y-0.5">
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const issue = lineDiagnosticMap.get(lineNum);
                const isHighlighted = highlightedLineNumber === lineNum;

                return (
                  <div
                    key={lineNum}
                    className={`h-[22px] flex items-center justify-end space-x-1.5 px-1 rounded ${
                      isHighlighted ? 'bg-indigo-500/20 text-indigo-300 font-bold' : ''
                    }`}
                  >
                    {issue && (
                      <span title={`${issue.severity.toUpperCase()}: ${issue.title}`}>
                        {issue.severity === 'critical' && (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 inline" />
                        )}
                        {issue.severity === 'warning' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline" />
                        )}
                        {issue.severity === 'syntax' && (
                          <Info className="w-3.5 h-3.5 text-sky-400 inline" />
                        )}
                        {issue.severity === 'notice' && (
                          <Info className="w-3.5 h-3.5 text-slate-400 inline" />
                        )}
                      </span>
                    )}
                    <span>{lineNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Editable Textarea */}
            <textarea
              value={rawText}
              onChange={(e) => onTextChange && onTextChange(e.target.value)}
              placeholder="Paste or write robots.txt content here..."
              spellCheck={false}
              className="w-full bg-transparent p-3 text-slate-100 font-mono text-xs leading-[22px] focus:outline-none resize-none whitespace-pre overflow-x-auto min-h-[360px]"
            />
          </div>
        ) : (
          /* Read-Only Formatted Line View */
          <div className="py-3 px-2">
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const issue = lineDiagnosticMap.get(lineNum);
              const isHighlighted = highlightedLineNumber === lineNum;

              // Colorize syntax
              let textColor = 'text-slate-300';
              const trimmed = lineText.trim();
              if (trimmed.startsWith('#')) {
                textColor = 'text-slate-500 italic';
              } else if (/^user-agent:/i.test(trimmed)) {
                textColor = 'text-indigo-300 font-semibold';
              } else if (/^allow:/i.test(trimmed)) {
                textColor = 'text-emerald-300';
              } else if (/^disallow:/i.test(trimmed)) {
                textColor = 'text-rose-300';
              } else if (/^sitemap:/i.test(trimmed)) {
                textColor = 'text-amber-300';
              }

              return (
                <div
                  key={lineNum}
                  className={`flex items-center h-[22px] px-2 rounded font-mono text-xs ${
                    isHighlighted
                      ? 'bg-indigo-600/30 border border-indigo-500/50 text-white font-bold'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="w-12 text-right pr-3 text-slate-500 select-none flex items-center justify-end space-x-1">
                    {issue && (
                      <span title={`${issue.severity.toUpperCase()}: ${issue.title}`}>
                        {issue.severity === 'critical' && (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 inline" />
                        )}
                        {issue.severity === 'warning' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline" />
                        )}
                        {issue.severity === 'syntax' && (
                          <Info className="w-3.5 h-3.5 text-sky-400 inline" />
                        )}
                      </span>
                    )}
                    <span>{lineNum}</span>
                  </div>

                  <div className={`flex-1 whitespace-pre ${textColor}`}>
                    {lineText || ' '}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
