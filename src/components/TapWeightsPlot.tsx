import React, { useRef, useEffect } from 'react';

interface TapWeightsPlotProps {
  trueTaps: number[];
  estimatedTaps: number[];
  title?: string;
}

const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const TapWeightsPlot: React.FC<TapWeightsPlotProps> = ({
  trueTaps,
  estimatedTaps,
  title = 'Tap Weights: h[k] vs ŵ[k]'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width  = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = cssVar('--c-canvas-grid');
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y < height; y += 25) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      ctx.stroke();

      // Zero line
      const zeroY = height / 2;
      ctx.strokeStyle = cssVar('--c-canvas-zeroline');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(width, zeroY);
      ctx.stroke();

      const numTaps = Math.max(trueTaps.length, estimatedTaps.length);
      if (numTaps === 0) return;

      const barWidth = (width / numTaps) * 0.28;
      const spacing  = width / numTaps;
      const maxVal   = Math.max(...trueTaps.map(Math.abs), ...estimatedTaps.map(Math.abs), 1.0) * 1.25;

      for (let i = 0; i < numTaps; i++) {
        const xCenter = spacing * (i + 0.5);

        // True tap bar
        const trueVal = trueTaps[i] || 0;
        const trueH   = (Math.abs(trueVal) / maxVal) * (height / 2);
        ctx.fillStyle = cssVar('--c-canvas-bar-true');
        ctx.fillRect(xCenter - barWidth - 2, zeroY - (trueVal >= 0 ? trueH : 0), barWidth, trueH);

        // Estimated tap bar
        const estVal = estimatedTaps[i] || 0;
        const estH   = (Math.abs(estVal) / maxVal) * (height / 2);
        ctx.fillStyle = cssVar('--c-canvas-bar-est');
        ctx.fillRect(xCenter + 2, zeroY - (estVal >= 0 ? estH : 0), barWidth, estH);

        // Index label
        ctx.fillStyle = cssVar('--c-canvas-legend');
        ctx.font = '15px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(`k=${i}`, xCenter, height - 4);
      }

      // Title
      ctx.textAlign = 'left';
      ctx.fillStyle = cssVar('--c-canvas-label');
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillText(title, 10, 18);

      // Legend
      ctx.font = '13px "JetBrains Mono"';
      ctx.fillStyle = cssVar('--c-canvas-bar-true');
      ctx.fillRect(width - 118, 9, 10, 10);
      ctx.fillStyle = cssVar('--c-canvas-legend');
      ctx.fillText('True h[k]', width - 104, 18);

      ctx.fillStyle = cssVar('--c-canvas-bar-est');
      ctx.fillRect(width - 118, 24, 10, 10);
      ctx.fillStyle = cssVar('--c-canvas-legend');
      ctx.fillText('Est ŵ[k]', width - 104, 34);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [trueTaps, estimatedTaps, title]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-panel backdrop-blur-md border border-border shadow-glass">
      <canvas ref={canvasRef} width={600} height={250} className="w-full h-full object-fill" />
    </div>
  );
};
