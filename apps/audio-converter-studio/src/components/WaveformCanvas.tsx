import React, { useEffect, useRef, useState, useCallback } from 'react';
import { extractWaveformData, WaveformPoint, formatTimecode } from '../lib/audioEngine';
import { TrimRegion } from '../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface WaveformCanvasProps {
  audioBuffer: AudioBuffer | null;
  trimRegion: TrimRegion;
  onChangeTrimRegion: (region: TrimRegion) => void;
  currentTime: number;
  onSeekTime: (timeSec: number) => void;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  isPlaying?: boolean;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  audioBuffer,
  trimRegion,
  onChangeTrimRegion,
  currentTime,
  onSeekTime,
  fadeInDuration = 0,
  fadeOutDuration = 0,
  isPlaying = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [zoom, setZoom] = useState<number>(1); // 1x to 32x
  const [waveformData, setWaveformData] = useState<WaveformPoint[]>([]);
  const [dragging, setDragging] = useState<'start' | 'end' | 'playhead' | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const duration = audioBuffer?.duration || 0;

  // Extract waveform data on audioBuffer change
  useEffect(() => {
    if (!audioBuffer) {
      setWaveformData([]);
      return;
    }
    const points = extractWaveformData(audioBuffer, 1200);
    setWaveformData(points);
  }, [audioBuffer]);

  // Main Canvas Render
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const midY = height / 2;

    // 1. Draw Grid lines & Time Ticks
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;

    const numTicks = 10;
    const timeStep = duration / numTicks;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '20px sans-serif';

    for (let i = 0; i <= numTicks; i++) {
      const t = i * timeStep;
      const x = (t / duration) * width;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      if (i > 0 && i < numTicks) {
        ctx.fillText(formatTimecode(t, false), x + 4, 24);
      }
    }

    // 2. Draw Waveform Peaks
    const numPoints = waveformData.length;
    const stepX = width / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const point = waveformData[i];
      const x = i * stepX;
      const sampleTime = (i / numPoints) * duration;

      const isInsideSelection = sampleTime >= trimRegion.start && sampleTime <= trimRegion.end;

      const minAmp = point.min * (midY - 10);
      const maxAmp = point.max * (midY - 10);

      const y1 = midY + minAmp;
      const y2 = midY + maxAmp;

      if (isInsideSelection) {
        // High contrast Emerald/Teal
        const gradient = ctx.createLinearGradient(0, y2, 0, y1);
        gradient.addColorStop(0, '#34d399');
        gradient.addColorStop(1, '#059669');
        ctx.fillStyle = gradient;
      } else {
        // Muted gray outside selection
        ctx.fillStyle = 'rgba(71, 85, 105, 0.5)';
      }

      ctx.fillRect(x, y2, Math.max(1, stepX - 0.5), Math.max(2, y1 - y2));
    }

    // 3. Draw Selected Region Highlight & Dim Unselected Regions
    const startX = (trimRegion.start / duration) * width;
    const endX = (trimRegion.end / duration) * width;

    // Left unselected dim overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(0, 0, startX, height);

    // Right unselected dim overlay
    ctx.fillRect(endX, 0, width - endX, height);

    // Selected region glowing subtle tint
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(startX, 0, endX - startX, height);

    // Border bounds
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, 0, endX - startX, height);

    // 4. Draw Fade In & Fade Out Overlay Curves
    if (fadeInDuration > 0) {
      const fadeInEndX = Math.min(endX, ((trimRegion.start + fadeInDuration) / duration) * width);
      ctx.strokeStyle = '#38bdf8'; // Sky blue fade line
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, height);
      ctx.lineTo(fadeInEndX, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (fadeOutDuration > 0) {
      const fadeOutStartX = Math.max(startX, ((trimRegion.end - fadeOutDuration) / duration) * width);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(fadeOutStartX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Draw Handles for Start and End Boundaries
    // Start Handle (Green)
    ctx.fillStyle = '#10b981';
    ctx.fillRect(startX - 6, 0, 12, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(startX - 2, height / 2 - 15, 4, 30);

    // End Handle (Green)
    ctx.fillStyle = '#10b981';
    ctx.fillRect(endX - 6, 0, 12, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(endX - 2, height / 2 - 15, 4, 30);

    // 6. Draw Playhead Indicator Line
    const playheadX = (currentTime / duration) * width;
    ctx.strokeStyle = '#f43f5e'; // Vibrant Rose/Red
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Playhead handle top triangle
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(playheadX - 8, 0);
    ctx.lineTo(playheadX + 8, 0);
    ctx.lineTo(playheadX, 14);
    ctx.closePath();
    ctx.fill();
  }, [audioBuffer, waveformData, duration, trimRegion, currentTime, fadeInDuration, fadeOutDuration]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, zoom]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth * 2;
      canvas.height = 180 * 2;
      renderCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  // Convert mouse pixel X to timestamp seconds
  const getTimeFromMouseX = useCallback(
    (clientX: number): number => {
      const container = containerRef.current;
      if (!container || duration === 0) return 0;
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      return (x / rect.width) * duration;
    },
    [duration]
  );

  // Mouse Interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!audioBuffer) return;
    const clickTime = getTimeFromMouseX(e.clientX);

    const startDist = Math.abs(clickTime - trimRegion.start);
    const endDist = Math.abs(clickTime - trimRegion.end);
    const playheadDist = Math.abs(clickTime - currentTime);

    // Determine nearest handle (threshold in seconds)
    const handleThreshold = duration * 0.03;

    if (startDist < handleThreshold && startDist <= endDist) {
      setDragging('start');
    } else if (endDist < handleThreshold) {
      setDragging('end');
    } else if (playheadDist < handleThreshold) {
      setDragging('playhead');
    } else {
      // Direct click seek or update closest handle
      if (clickTime < trimRegion.start) {
        onChangeTrimRegion({ ...trimRegion, start: clickTime });
      } else if (clickTime > trimRegion.end) {
        onChangeTrimRegion({ ...trimRegion, end: clickTime });
      } else {
        onSeekTime(clickTime);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const time = getTimeFromMouseX(e.clientX);
    setHoverTime(time);

    if (!dragging || !audioBuffer) return;

    if (dragging === 'start') {
      const newStart = Math.max(0, Math.min(time, trimRegion.end - 0.05));
      onChangeTrimRegion({ ...trimRegion, start: newStart });
    } else if (dragging === 'end') {
      const newEnd = Math.min(duration, Math.max(time, trimRegion.start + 0.05));
      onChangeTrimRegion({ ...trimRegion, end: newEnd });
    } else if (dragging === 'playhead') {
      onSeekTime(Math.max(0, Math.min(duration, time)));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-2xl relative select-none">
      
      {/* Top Header Controls: Zoom & Time Tooltip */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Waveform Studio
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono">
            Sel: <strong className="text-emerald-400">{formatTimecode(trimRegion.end - trimRegion.start)}</strong>
          </span>
        </div>

        {/* Zoom & Reset Toolbar */}
        <div className="flex items-center gap-2">
          {hoverTime !== null && (
            <div className="text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              Pos: <span className="text-cyan-400">{formatTimecode(hoverTime)}</span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setZoom((z) => Math.max(1, z / 1.5))}
              title="Zoom Out"
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-slate-400 font-mono text-[10px]">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(16, z * 1.5))}
              title="Zoom In"
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              title="Fit to Screen"
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition ml-1 border-l border-slate-700"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Canvas Element */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoverTime(null);
        }}
        className="relative w-full h-[180px] rounded-xl overflow-hidden bg-slate-950 cursor-crosshair border border-slate-800/80 shadow-inner"
      >
        <canvas
          ref={canvasRef}
          width={1600}
          height={360}
          className="w-full h-full block"
        />

        {/* Empty State Overlay */}
        {!audioBuffer && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm text-slate-400">
            <p className="text-sm font-medium">No Audio File Loaded</p>
            <p className="text-xs text-slate-500 mt-1">Upload an audio file to view interactive waveform</p>
          </div>
        )}
      </div>

      {/* Footer Info Legend */}
      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 px-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Selected Region
          </span>
          {fadeInDuration > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-400"></span> Fade In ({fadeInDuration}s)
            </span>
          )}
          {fadeOutDuration > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-400"></span> Fade Out ({fadeOutDuration}s)
            </span>
          )}
        </div>
        <div className="text-slate-500 font-mono">
          00:00.000 — {formatTimecode(duration)}
        </div>
      </div>

    </div>
  );
};
