import React, { useRef, useEffect } from 'react';

interface PoleZeroPlotProps {
  trueAlpha: number;
  trueDelay: number;
  estAlpha: number;
  estDelay: number;
}

const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const PoleZeroPlot: React.FC<PoleZeroPlotProps> = ({
  trueAlpha, trueDelay, estAlpha, estDelay
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) * 0.7; // Unit circle radius

      ctx.clearRect(0, 0, width, height);

      // Grid & Unit Circle
      ctx.strokeStyle = cssVar('--c-canvas-grid');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(width, cy); // Re-axis
      ctx.moveTo(cx, 0); ctx.lineTo(cx, height); // Im-axis
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      const drawZero = (x: number, y: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.stroke();
      };

      const drawPole = (x: number, y: number, color: string, count: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4);
        ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4);
        ctx.stroke();
        
        if (count > 1) {
          ctx.fillStyle = color;
          ctx.font = '10px "JetBrains Mono"';
          ctx.fillText(`x${count}`, x + 8, y - 8);
        }
      };

      // H(z) = 1 + alpha * z^-D
      // Zeros: z = |alpha|^(1/D) * e^(j * (theta + 2*pi*k)/D)
      // Poles: D poles at origin

      // Draw True Zeros
      if (trueDelay > 0) {
        const mag = Math.pow(Math.abs(trueAlpha), 1/trueDelay);
        const theta = trueAlpha >= 0 ? Math.PI : 0;
        
        for (let k = 0; k < trueDelay; k++) {
          const angle = (theta + 2 * Math.PI * k) / trueDelay;
          const re = mag * Math.cos(angle);
          const im = mag * Math.sin(angle);
          drawZero(cx + re * radius, cy - im * radius, cssVar('--c-canvas-bar-true'));
        }
        drawPole(cx, cy, cssVar('--c-canvas-bar-true'), trueDelay);
      }

      // Draw Estimated Zeros
      if (estDelay > 0 && estAlpha !== 0) {
        const mag = Math.pow(Math.abs(estAlpha), 1/estDelay);
        const theta = estAlpha >= 0 ? Math.PI : 0;
        
        for (let k = 0; k < estDelay; k++) {
          const angle = (theta + 2 * Math.PI * k) / estDelay;
          const re = mag * Math.cos(angle);
          const im = mag * Math.sin(angle);
          drawZero(cx + re * radius, cy - im * radius, cssVar('--c-canvas-bar-est'));
        }
      }

      // Labels
      ctx.fillStyle = cssVar('--c-canvas-label');
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Pole-Zero: H(z) = 1 + αz⁻ᴰ', 10, 18);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [trueAlpha, trueDelay, estAlpha, estDelay]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-panel backdrop-blur-md border border-border shadow-glass">
      <canvas ref={canvasRef} width={250} height={250} className="w-full h-full object-fill" />
    </div>
  );
};
