export type AppMode = 'trimmer' | 'converter' | 'recorder';

export type ExportFormat = 'wav' | 'webm' | 'ogg' | 'mp3';

export type WavBitDepth = '16' | '24' | '32float';

export interface FormatSettings {
  format: ExportFormat;
  sampleRate: number; // e.g. 44100, 48000, 22050
  channels: 1 | 2; // 1 = Mono, 2 = Stereo
  wavBitDepth: WavBitDepth;
  bitrateKbps: number; // e.g. 128, 192, 320
}

export interface TrimRegion {
  start: number; // in seconds
  end: number;   // in seconds
}

export interface AudioFXSettings {
  fadeInDuration: number;  // in seconds
  fadeInCurve: 'linear' | 'exponential' | 'scurve';
  fadeOutDuration: number; // in seconds
  fadeOutCurve: 'linear' | 'exponential' | 'scurve';
  gainRatio: number;       // 0.0 to 3.0 (1.0 = 100%)
  speedRate: number;       // 0.5 to 2.0 (1.0 = normal)
  preservePitch: boolean;
  normalize: boolean;
  reverse: boolean;
  eqPreset: 'flat' | 'bass-boost' | 'vocal' | 'treble-boost' | 'low-pass' | 'high-pass';
}

export interface AudioFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url: string;
  audioBuffer?: AudioBuffer;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  status: 'idle' | 'loading' | 'ready' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  outputBlob?: Blob;
  outputUrl?: string;
  outputSize?: number;
  outputFormat?: ExportFormat;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  iconName: string;
  formatSettings: Partial<FormatSettings>;
  fxSettings: Partial<AudioFXSettings>;
  trimDuration?: number; // e.g. 30s for ringtone
}
