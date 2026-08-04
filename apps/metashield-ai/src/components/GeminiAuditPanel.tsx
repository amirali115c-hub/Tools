import React, { useState } from 'react';
import { ImageFileRecord, AiPrivacyAudit } from '../types';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Copy,
  Check,
  Globe,
  Lock,
} from 'lucide-react';

interface GeminiAuditPanelProps {
  currentRecord: ImageFileRecord;
  onRunAudit: (record: ImageFileRecord) => Promise<void>;
  onTriggerClean: () => void;
}

export const GeminiAuditPanel: React.FC<GeminiAuditPanelProps> = ({
  currentRecord,
  onRunAudit,
  onTriggerClean,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const audit = currentRecord.privacyAudit;
  const isAuditing = currentRecord.isAuditing;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-rose-400 border-rose-500/50 bg-rose-950/30';
    if (score >= 35) return 'text-amber-400 border-amber-500/50 bg-amber-950/30';
    return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-rose-950 text-rose-400 border-rose-800/60';
      case 'medium':
        return 'bg-amber-950 text-amber-400 border-amber-800/60';
      default:
        return 'bg-sky-950 text-sky-400 border-sky-800/60';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              Privacy & Forensics Audit (100% Client-Side)
            </h3>
            <p className="text-xs text-slate-400">
              Evaluates binary metadata, AI prompts, C2PA claims, and file signatures offline with 0 server API calls.
            </p>
          </div>
        </div>

        <button
          onClick={() => onRunAudit(currentRecord)}
          disabled={isAuditing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 shrink-0"
        >
          {isAuditing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Auditing Client-Side...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              {audit ? 'Re-Run Privacy Audit' : 'Run Privacy Audit'}
            </>
          )}
        </button>
      </div>

      {/* Audit Results View */}
      {!audit && !isAuditing ? (
        <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col items-center">
          <Lock className="w-10 h-10 text-purple-400 mb-3" />
          <h4 className="font-bold text-slate-200 text-base mb-1">
            No AI Audit Analysis Executed Yet
          </h4>
          <p className="text-xs text-slate-400 max-w-md mb-6">
            Run a full Gemini 3.6 Flash security analysis on <span className="text-slate-200 font-semibold">{currentRecord.name}</span> to check for hidden AI generator tags, personal identifying leakage, and public sharing risk scores.
          </p>
          <button
            onClick={() => onRunAudit(currentRecord)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Analyze Privacy & AI Tags Now
          </button>
        </div>
      ) : isAuditing ? (
        <div className="p-12 text-center bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
          <h4 className="font-bold text-slate-200 text-sm">Auditing Image with Gemini AI...</h4>
          <p className="text-xs text-slate-400">Examining binary metadata, visual textures, and location coordinates...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Risk Score & AI Detection Scorecard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Risk Score */}
            <div className={`border rounded-2xl p-5 flex flex-col justify-between ${getScoreColor(audit.privacyScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Privacy Leak Risk</span>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-mono">{audit.privacyScore}</span>
                <span className="text-xs font-semibold uppercase">/ 100 ({audit.riskLevel} Risk)</span>
              </div>
              <p className="text-[11px] opacity-80 mt-2">
                {audit.privacyScore > 50
                  ? 'High probability of exposing location, device serial numbers, or AI prompt data.'
                  : 'Low privacy leakage detected. Safe to share after light scrubbing.'}
              </p>
            </div>

            {/* AI Generator Detection */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Generator Check</span>
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-100 block">
                  {audit.aiDetectionResult.isAiGenerated
                    ? audit.aiDetectionResult.detectedEngine || 'AI Generated Image'
                    : 'Photographic / Human Created'}
                </span>
                <span className="text-xs text-purple-300/80 font-medium mt-0.5 block">
                  {audit.aiDetectionResult.confidence}% AI Detection Confidence
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                {audit.aiDetectionResult.visualReasoning}
              </p>
            </div>

            {/* Public Sharing Safety */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Public Sharing Safety</span>
                <Globe className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  audit.socialSharingSafety.safeForPublic
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                    : 'bg-rose-950 text-rose-400 border-rose-800/60'
                }`}>
                  {audit.socialSharingSafety.safeForPublic ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Safe for Public Upload
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Scrub Before Sharing
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                {audit.socialSharingSafety.summary}
              </p>
            </div>
          </div>

          {/* Privacy Findings List */}
          {audit.privacyFindings && audit.privacyFindings.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <h4 className="font-bold text-slate-100 text-sm mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Detected Privacy Vulnerabilities ({audit.privacyFindings.length})
              </h4>

              <div className="space-y-3">
                {audit.privacyFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityBadge(finding.severity)}`}>
                          {finding.severity}
                        </span>
                        <span className="font-bold text-xs text-slate-200">{finding.category}</span>
                      </div>
                      <p className="text-xs text-slate-300">{finding.description}</p>
                      <p className="text-[11px] text-sky-400 font-medium">💡 Recommendation: {finding.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Safety Breakdown */}
          {audit.socialSharingSafety.platformRecommendations && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <h4 className="font-bold text-slate-100 text-sm mb-3">
                Platform Social Sharing Recommendations
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(audit.socialSharingSafety.platformRecommendations).map(([platform, text]) => (
                  <div key={platform} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block mb-1">
                      {platform}
                    </span>
                    <p className="text-xs text-slate-400 leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action Button */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-emerald-800/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Ready to anonymize this file?</h4>
              <p className="text-xs text-slate-400">1-click scrub all identified EXIF tags, GPS coordinates, and AI prompt fields.</p>
            </div>

            <button
              onClick={onTriggerClean}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all shrink-0"
            >
              Scrub Privacy Leaks Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
