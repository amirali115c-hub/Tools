import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  type?: 'bars' | 'wave' | 'circle';
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  isPlaying,
  type = 'bars',
  height = 80,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      if (!analyserNode || !isPlaying) {
        // Draw idle subtle line
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(width, h / 2);
        ctx.stroke();
        return;
      }

      if (type === 'bars') {
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2.2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * h;

          const gradient = ctx.createLinearGradient(0, h - barHeight, 0, h);
          gradient.addColorStop(0, '#10b981'); // Emerald
          gradient.addColorStop(0.5, '#14b8a6'); // Teal
          gradient.addColorStop(1, '#06b6d4'); // Cyan

          ctx.fillStyle = gradient;
          ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);

          x += barWidth;
          if (x > width) break;
        }
      } else if (type === 'wave') {
        const bufferLength = analyserNode.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(0.5, '#06b6d4');
        gradient.addColorStop(1, '#3b82f6');
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, h / 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [analyserNode, isPlaying, type]);

  return (
    <div className="w-full bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800/80 p-2">
      <canvas
        ref={canvasRef}
        width={800}
        height={height * 2}
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
};
