import React, { useRef, useEffect } from 'react';

interface OscilloscopePlotProps {
  dataSets: { data: Float32Array; color: string; label: string }[];
  yMin?: number;
  yMax?: number;
  title: string;
}

/** Read a CSS custom property from :root / html element at runtime (theme-aware). */
const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const OscilloscopePlot: React.FC<OscilloscopePlotProps> = ({
  dataSets,
  yMin = -2,
  yMax = 2,
  title
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

      // Clear — transparent so the glass panel background shows through
      ctx.clearRect(0, 0, width, height);

      // ── Grid ─────────────────────────────────────────────────────────
      ctx.strokeStyle = cssVar('--c-canvas-grid');
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      for (let y = 0; y < height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      ctx.stroke();

      // ── Zero line ────────────────────────────────────────────────────
      const zeroY = height - ((0 - yMin) / (yMax - yMin)) * height;
      ctx.strokeStyle = cssVar('--c-canvas-zeroline');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(width, zeroY);
      ctx.stroke();

      // ── Traces ───────────────────────────────────────────────────────
      dataSets.forEach(({ data, color }) => {
        if (data.length === 0) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const stepX = width / data.length;
        for (let i = 0; i < data.length; i++) {
          const x = i * stepX;
          const normalizedY = (data[i] - yMin) / (yMax - yMin);
          const y = height - normalizedY * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // ── Title ────────────────────────────────────────────────────────
      ctx.fillStyle = cssVar('--c-canvas-label');
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(title, 10, 18);

      // ── Legend ───────────────────────────────────────────────────────
      let legendY = 18;
      dataSets.forEach(({ color, label }) => {
        ctx.fillStyle = color;
        ctx.fillText(label, width - 10 - ctx.measureText(label).width, legendY);
        legendY += 16;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [dataSets, yMin, yMax, title]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-panel backdrop-blur-md border border-border shadow-glass">
      <canvas
        ref={canvasRef}
        width={600}
        height={250}
        className="w-full h-full object-fill"
      />
    </div>
  );
};
