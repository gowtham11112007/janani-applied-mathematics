import React, { useRef, useEffect } from 'react';

const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

interface MagnitudeResponseProps {
  trueTaps: number[];
  estimatedTaps: number[];
}

export const MagnitudeResponse: React.FC<MagnitudeResponseProps> = ({ trueTaps, estimatedTaps }) => {
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
      for (let x = 0; x < width; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      ctx.stroke();

      const numBins = 120;

      const computeMag = (taps: number[], w: number) => {
        let re = 0, im = 0;
        for (let k = 0; k < taps.length; k++) {
          re += taps[k] * Math.cos(-w * k);
          im += taps[k] * Math.sin(-w * k);
        }
        return Math.sqrt(re * re + im * im);
      };

      const plotSpectrum = (taps: number[], color: string, lineWidth: number, fill: boolean) => {
        if (!taps || taps.length === 0) return;
        ctx.beginPath();
        for (let i = 0; i <= numBins; i++) {
          const w   = (i / numBins) * Math.PI;
          const mag = Math.min(computeMag(taps, w), 3);          // clamp display to 3
          const y   = height - (mag / 3) * height * 0.9;
          const x   = (i / numBins) * width;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        if (fill) {
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.fillStyle = color;
          ctx.fill();
        } else {
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };

      // True spectrum (muted fill)
      plotSpectrum(trueTaps, cssVar('--c-canvas-bar-true'), 0, true);
      // Estimated spectrum (bright stroke)
      plotSpectrum(estimatedTaps, '#e879f9', 2, false);

      // Title
      ctx.fillStyle = cssVar('--c-canvas-label');
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('|H(e^jω)|  Frequency Response', 10, 18);

      // Legend
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillStyle = cssVar('--c-canvas-bar-true');
      ctx.fillRect(width - 118, 9, 10, 10);
      ctx.fillStyle = cssVar('--c-canvas-legend');
      ctx.fillText('True H(z)', width - 104, 18);

      ctx.fillStyle = '#e879f9';
      ctx.fillRect(width - 118, 24, 10, 10);
      ctx.fillStyle = cssVar('--c-canvas-legend');
      ctx.fillText('Est Ĥ(z)', width - 104, 34);

      // Axis labels
      ctx.fillStyle = cssVar('--c-canvas-legend');
      ctx.font = '9px "JetBrains Mono"';
      ctx.fillText('0', 4, height - 4);
      ctx.fillText('π', width - 12, height - 4);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [trueTaps, estimatedTaps]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-panel backdrop-blur-md border border-border shadow-glass">
      <canvas ref={canvasRef} width={600} height={250} className="w-full h-full object-fill" />
    </div>
  );
};
