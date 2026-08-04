import React from 'react';
import { Preset } from '../types';
import { Smartphone, Mic, Sparkles, FileAudio, Disc } from 'lucide-react';

interface PresetBarProps {
  onSelectPreset: (preset: Preset) => void;
  audioDuration?: number;
}

export const PRESETS: Preset[] = [
  {
    id: 'ringtone',
    name: '30s Ringtone',
    description: 'Auto-trims 30s cut with 1s fade-in/out, stereo 44.1kHz',
    iconName: 'ringtone',
    formatSettings: { format: 'wav', sampleRate: 44100, channels: 2 },
    fxSettings: { fadeInDuration: 1.0, fadeOutDuration: 1.5, normalize: true },
    trimDuration: 30,
  },
  {
    id: 'voice-clean',
    name: 'Voice / Podcast Clean',
    description: 'Mono downmix + High-Pass filter to remove rumble + vocal EQ boost',
    iconName: 'voice',
    formatSettings: { format: 'wav', sampleRate: 44100, channels: 1 },
    fxSettings: { eqPreset: 'vocal', normalize: true, gainRatio: 1.2 },
  },
  {
    id: 'small-web',
    name: 'Compressed Web / Mail',
    description: 'Small size Opus/WebM encoding at 64 kbps, mono 22.05kHz',
    iconName: 'small',
    formatSettings: { format: 'webm', sampleRate: 22050, channels: 1, bitrateKbps: 64 },
    fxSettings: { normalize: true },
  },
  {
    id: 'hifi-archive',
    name: 'High-Fi Master',
    description: 'Uncompressed 24-bit PCM WAV at 48kHz, Bass boost',
    iconName: 'hifi',
    formatSettings: { format: 'wav', sampleRate: 48000, channels: 2, wavBitDepth: '24' },
    fxSettings: { eqPreset: 'flat', normalize: false },
  },
];

export const PresetBar: React.FC<PresetBarProps> = ({ onSelectPreset, audioDuration }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Studio Presets</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PRESETS.map((preset) => {
          let Icon = FileAudio;
          if (preset.id === 'ringtone') Icon = Smartphone;
          if (preset.id === 'voice-clean') Icon = Mic;
          if (preset.id === 'small-web') Icon = Disc;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className="flex items-start gap-3 p-3 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 transition-all group"
            >
              <div className="p-2 rounded-lg bg-slate-900 group-hover:bg-emerald-500/10 text-slate-400 group-hover:text-emerald-400 border border-slate-700/60 group-hover:border-emerald-500/20 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                  {preset.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {preset.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
