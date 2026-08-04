import { AudioFXSettings, ExportFormat, FormatSettings, TrimRegion } from '../types';
import { encodeWav } from './wavEncoder';

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new AudioCtxClass();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

/**
 * Decodes an Audio File into a Web Audio API AudioBuffer
 */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  // decodeAudioData consumes arrayBuffer, so pass a clone
  return await ctx.decodeAudioData(arrayBuffer.slice(0));
}

/**
 * Extracts peak min/max and RMS data for high-performance waveform rendering
 */
export interface WaveformPoint {
  min: number;
  max: number;
  rms: number;
}

export function extractWaveformData(buffer: AudioBuffer, numPoints: number = 1000): WaveformPoint[] {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const samplesPerPoint = Math.max(1, Math.floor(length / numPoints));
  const points: WaveformPoint[] = [];

  // Use channel 0 (or mix channels)
  const channelData0 = buffer.getChannelData(0);
  const channelData1 = numChannels > 1 ? buffer.getChannelData(1) : null;

  for (let i = 0; i < numPoints; i++) {
    const startSample = i * samplesPerPoint;
    const endSample = Math.min(startSample + samplesPerPoint, length);

    let min = 1.0;
    let max = -1.0;
    let sumSquares = 0;
    let count = 0;

    for (let s = startSample; s < endSample; s++) {
      let val = channelData0[s];
      if (channelData1) {
        val = (val + channelData1[s]) * 0.5;
      }
      if (val < min) min = val;
      if (val > max) max = val;
      sumSquares += val * val;
      count++;
    }

    const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
    points.push({
      min: isFinite(min) ? min : 0,
      max: isFinite(max) ? max : 0,
      rms: isNaN(rms) ? 0 : rms,
    });
  }

  return points;
}

/**
 * Slice an AudioBuffer between start and end (in seconds)
 */
export function sliceAudioBuffer(
  audioCtx: AudioContext | OfflineAudioContext,
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(buffer.length, Math.floor(endSec * sampleRate));
  const frameCount = Math.max(1, endSample - startSample);
  const channels = buffer.numberOfChannels;

  const slicedBuffer = audioCtx.createBuffer(channels, frameCount, sampleRate);

  for (let c = 0; c < channels; c++) {
    const src = buffer.getChannelData(c);
    const dst = slicedBuffer.getChannelData(c);
    dst.set(src.subarray(startSample, endSample));
  }

  return slicedBuffer;
}

/**
 * Merge multiple AudioBuffers into a single continuous AudioBuffer
 */
export function mergeAudioBuffers(
  audioCtx: AudioContext | OfflineAudioContext,
  buffers: AudioBuffer[]
): AudioBuffer {
  if (buffers.length === 0) {
    return audioCtx.createBuffer(2, 44100, 44100);
  }
  if (buffers.length === 1) return buffers[0];

  let totalFrames = 0;
  let maxChannels = 1;
  const targetSampleRate = buffers[0].sampleRate;

  for (const b of buffers) {
    totalFrames += b.length;
    if (b.numberOfChannels > maxChannels) {
      maxChannels = b.numberOfChannels;
    }
  }

  const merged = audioCtx.createBuffer(maxChannels, totalFrames, targetSampleRate);

  for (let c = 0; c < maxChannels; c++) {
    const dst = merged.getChannelData(c);
    let offset = 0;
    for (const b of buffers) {
      const srcChannel = c < b.numberOfChannels ? b.getChannelData(c) : b.getChannelData(0);
      dst.set(srcChannel, offset);
      offset += b.length;
    }
  }

  return merged;
}

/**
 * Applies FX (fades, gain, EQ, reverse, speed/pitch, channel downmix) and renders to processed AudioBuffer
 */
export async function processAudioEffects(
  inputBuffer: AudioBuffer,
  fxSettings: AudioFXSettings,
  targetChannels: 1 | 2 = 2,
  targetSampleRate: number = 44100
): Promise<AudioBuffer> {
  const origDuration = inputBuffer.duration;
  // If speedRate is changed, the new duration will be origDuration / speedRate
  const speed = Math.max(0.25, Math.min(4.0, fxSettings.speedRate || 1.0));
  const newDuration = origDuration / speed;

  const numChannels = Math.min(targetChannels, inputBuffer.numberOfChannels);
  const frameCount = Math.max(1, Math.floor(newDuration * targetSampleRate));

  const offlineCtx = new OfflineAudioContext(numChannels, frameCount, targetSampleRate);

  // Source node
  const source = offlineCtx.createBufferSource();
  source.buffer = inputBuffer;
  source.playbackRate.value = speed;

  let lastNode: AudioNode = source;

  // Equalizer node setup if requested
  if (fxSettings.eqPreset && fxSettings.eqPreset !== 'flat') {
    switch (fxSettings.eqPreset) {
      case 'bass-boost': {
        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'lowshelf';
        filter.frequency.value = 200;
        filter.gain.value = 6; // +6dB
        lastNode.connect(filter);
        lastNode = filter;
        break;
      }
      case 'vocal': {
        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = 2500;
        filter.Q.value = 1.0;
        filter.gain.value = 5; // +5dB voice range boost
        lastNode.connect(filter);
        lastNode = filter;
        break;
      }
      case 'treble-boost': {
        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'highshelf';
        filter.frequency.value = 4000;
        filter.gain.value = 6;
        lastNode.connect(filter);
        lastNode = filter;
        break;
      }
      case 'high-pass': {
        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 150; // Cut rumble/wind below 150Hz
        lastNode.connect(filter);
        lastNode = filter;
        break;
      }
      case 'low-pass': {
        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3500; // Muffle high frequencies
        lastNode.connect(filter);
        lastNode = filter;
        break;
      }
    }
  }

  // Gain node
  const gainNode = offlineCtx.createGain();
  const gainRatio = Math.max(0, Math.min(5.0, fxSettings.gainRatio ?? 1.0));
  gainNode.gain.setValueAtTime(gainRatio, 0);
  lastNode.connect(gainNode);
  lastNode = gainNode;

  lastNode.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();

  // Handle Reverse if requested
  if (fxSettings.reverse) {
    for (let c = 0; c < renderedBuffer.numberOfChannels; c++) {
      renderedBuffer.getChannelData(c).reverse();
    }
  }

  // Handle Fade In / Fade Out in-place on renderedBuffer
  const len = renderedBuffer.length;
  const sr = renderedBuffer.sampleRate;

  if (fxSettings.fadeInDuration > 0) {
    const fadeInSamples = Math.min(len, Math.floor(fxSettings.fadeInDuration * sr));
    for (let c = 0; c < renderedBuffer.numberOfChannels; c++) {
      const data = renderedBuffer.getChannelData(c);
      for (let i = 0; i < fadeInSamples; i++) {
        let factor = i / fadeInSamples;
        if (fxSettings.fadeInCurve === 'exponential') {
          factor = Math.pow(factor, 2);
        } else if (fxSettings.fadeInCurve === 'scurve') {
          factor = 0.5 * (1 - Math.cos(Math.PI * factor));
        }
        data[i] *= factor;
      }
    }
  }

  if (fxSettings.fadeOutDuration > 0) {
    const fadeOutSamples = Math.min(len, Math.floor(fxSettings.fadeOutDuration * sr));
    const startFadeIndex = Math.max(0, len - fadeOutSamples);
    for (let c = 0; c < renderedBuffer.numberOfChannels; c++) {
      const data = renderedBuffer.getChannelData(c);
      for (let i = startFadeIndex; i < len; i++) {
        let factor = (len - i) / fadeOutSamples;
        if (fxSettings.fadeOutCurve === 'exponential') {
          factor = Math.pow(factor, 2);
        } else if (fxSettings.fadeOutCurve === 'scurve') {
          factor = 0.5 * (1 - Math.cos(Math.PI * factor));
        }
        data[i] *= factor;
      }
    }
  }

  // Handle Peak Normalization if requested
  if (fxSettings.normalize) {
    let maxPeak = 0;
    for (let c = 0; c < renderedBuffer.numberOfChannels; c++) {
      const data = renderedBuffer.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const absVal = Math.abs(data[i]);
        if (absVal > maxPeak) maxPeak = absVal;
      }
    }

    if (maxPeak > 0.0001 && maxPeak < 0.99) {
      const normFactor = 0.98 / maxPeak; // Normalize to -0.2dB
      for (let c = 0; c < renderedBuffer.numberOfChannels; c++) {
        const data = renderedBuffer.getChannelData(c);
        for (let i = 0; i < len; i++) {
          data[i] *= normFactor;
        }
      }
    }
  }

  return renderedBuffer;
}

/**
 * Encodes processed AudioBuffer into target format Blob (WAV, WebM, OGG, or MP3)
 */
export async function encodeAudioBufferToBlob(
  buffer: AudioBuffer,
  formatSettings: FormatSettings,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const { format, wavBitDepth, bitrateKbps } = formatSettings;

  if (format === 'wav') {
    onProgress?.(80);
    const blob = encodeWav(buffer, wavBitDepth);
    onProgress?.(100);
    return blob;
  }

  // For WebM or OGG compressed audio:
  // Use MediaRecorder over a real-time/offline Stream destination
  const mimeMap: Record<string, string[]> = {
    webm: ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'],
    ogg: ['audio/ogg;codecs=opus', 'audio/ogg;codecs=vorbis', 'audio/ogg', 'audio/webm'],
    mp3: ['audio/mp3', 'audio/mpeg', 'audio/webm;codecs=opus', 'audio/wav'],
  };

  const candidates = mimeMap[format] || ['audio/webm'];
  let mimeType = candidates.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) || 'audio/webm';

  onProgress?.(20);

  // Play buffer into AudioDestinationNode stream
  const audioCtx = getAudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(dest);

  const recorderOptions: MediaRecorderOptions = { mimeType };
  if (bitrateKbps) {
    recorderOptions.audioBitsPerSecond = bitrateKbps * 1000;
  }

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(dest.stream, recorderOptions);
  } catch {
    recorder = new MediaRecorder(dest.stream);
  }

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      onProgress?.(100);
      const finalBlob = new Blob(chunks, { type: mimeType });
      resolve(finalBlob);
    };

    recorder.onerror = (e) => {
      // Fallback to WAV if recorder fails
      console.warn('MediaRecorder error, falling back to WAV:', e);
      resolve(encodeWav(buffer, '16'));
    };

    source.start(0);
    recorder.start(100);

    const totalTimeMs = buffer.duration * 1000;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      const pct = Math.min(95, Math.floor((elapsed / totalTimeMs) * 70) + 20);
      onProgress?.(pct);
    }, 100);

    source.onended = () => {
      clearInterval(interval);
      setTimeout(() => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }, 150);
    };
  });
}

/**
 * Format time helper (HH:MM:SS.mmm)
 */
export function formatTimecode(seconds: number, showMs: boolean = true): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const mStr = String(mins).padStart(2, '0');
  const sStr = String(secs).padStart(2, '0');
  const msStr = String(ms).padStart(3, '0');

  return showMs ? `${mStr}:${sStr}.${msStr}` : `${mStr}:${sStr}`;
}

/**
 * Format file size helper (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
