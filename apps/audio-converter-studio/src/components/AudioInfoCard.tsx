import React from 'react';
import { formatFileSize, formatTimecode } from '../lib/audioEngine';
import { FileText, Music, Radio, Volume2, Shield } from 'lucide-react';

interface AudioInfoCardProps {
  file: File | null;
  audioBuffer: AudioBuffer | null;
}

export const AudioInfoCard: React.FC<AudioInfoCardProps> = ({ file, audioBuffer }) => {
  if (!file && !audioBuffer) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <span className="font-semibold text-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Loaded File Specifications
        </span>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
          {file?.type || 'Audio Stream'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-1 mb-1">
            <Music className="w-3.5 h-3.5 text-cyan-400" /> File Size
          </span>
          <span className="font-bold text-slate-100 font-mono">
            {file ? formatFileSize(file.size) : 'N/A'}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-1 mb-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400" /> Duration
          </span>
          <span className="font-bold text-slate-100 font-mono">
            {audioBuffer ? formatTimecode(audioBuffer.duration) : '--:--'}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-1 mb-1">
            <Volume2 className="w-3.5 h-3.5 text-teal-400" /> Sample Rate
          </span>
          <span className="font-bold text-slate-100 font-mono">
            {audioBuffer ? `${audioBuffer.sampleRate} Hz` : '44,100 Hz'}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-1 mb-1">
            <Shield className="w-3.5 h-3.5 text-indigo-400" /> Channels
          </span>
          <span className="font-bold text-slate-100 font-mono">
            {audioBuffer
              ? audioBuffer.numberOfChannels === 1
                ? '1 (Mono)'
                : '2 (Stereo)'
              : 'Stereo'}
          </span>
        </div>
      </div>
    </div>
  );
};
