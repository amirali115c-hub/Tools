import React, { useState, useRef, useEffect } from 'react';
import { AudioVisualizer } from './AudioVisualizer';
import { formatTimecode } from '../lib/audioEngine';
import { Mic, Square, Play, Pause, Send, Trash2, ShieldCheck, Radio } from 'lucide-react';

interface AudioRecorderProps {
  onSendToTrimmer: (file: File) => void;
  onSendToConverter: (file: File) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onSendToTrimmer,
  onSendToConverter,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio preview element ref for playback of recorded clip
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      setAnalyserNode(analyser);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);

        // Stop mic tracks
        stream.getTracks().forEach((track) => track.stop());
        setAnalyserNode(null);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or not available in this browser: ' + (err as Error).message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
    setIsPlayingPreview(false);
  };

  const handleSendToTrimmer = () => {
    if (!recordedBlob) return;
    const filename = `voice_recording_${Date.now()}.webm`;
    const file = new File([recordedBlob], filename, { type: recordedBlob.type });
    onSendToTrimmer(file);
  };

  const handleSendToConverter = () => {
    if (!recordedBlob) return;
    const filename = `voice_recording_${Date.now()}.webm`;
    const file = new File([recordedBlob], filename, { type: recordedBlob.type });
    onSendToConverter(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            Studio Voice & Mic Recorder
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record high-quality audio directly from your microphone and load instantly into the studio.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span>Local Recording Only</span>
        </div>
      </div>

      {/* Visualizer Area */}
      <div className="space-y-3">
        <AudioVisualizer
          analyserNode={analyserNode}
          isPlaying={isRecording}
          type="bars"
          height={100}
        />

        {/* Timer display */}
        <div className="flex items-center justify-center gap-3">
          {isRecording && (
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
          )}
          <span className="font-mono text-3xl font-black tracking-wider text-white">
            {formatTimecode(recordingTime, false)}
          </span>
        </div>
      </div>

      {/* Record / Stop Action Button */}
      <div className="flex justify-center items-center gap-4 py-2">
        {!isRecording && !recordedBlob && (
          <button
            onClick={startRecording}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Mic className="w-6 h-6 animate-pulse" />
            <span>Start Recording</span>
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base shadow-xl shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Square className="w-6 h-6" />
            <span>Stop Recording</span>
          </button>
        )}
      </div>

      {/* Recording Preview & Direct Studio Actions */}
      {recordedBlob && recordedUrl && (
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Recording Complete ({formatTimecode(recordingTime, false)})
            </span>
            <button
              onClick={discardRecording}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          </div>

          <audio
            ref={previewAudioRef}
            src={recordedUrl}
            controls
            className="w-full h-10 rounded-xl"
            onPlay={() => setIsPlayingPreview(true)}
            onPause={() => setIsPlayingPreview(false)}
          />

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleSendToTrimmer}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              <Send className="w-4 h-4" />
              <span>Edit & Trim in Audio Studio</span>
            </button>

            <button
              onClick={handleSendToConverter}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
            >
              <Send className="w-4 h-4 text-teal-400" />
              <span>Convert Format in Batch Studio</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
