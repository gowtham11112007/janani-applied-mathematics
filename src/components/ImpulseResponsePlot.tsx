import React, { useRef, useEffect } from 'react';

interface ImpulseResponsePlotProps {
  trueAlpha: number;
  trueDelay: number;
  estAlpha: number;
  estDelay: number;
}

const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const ImpulseResponsePlot: React.FC<ImpulseResponsePlotProps> = ({
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
      ctx.moveTo(0, zeroY); ctx.lineTo(width, zeroY);
      ctx.stroke();

      const maxDelay = 50; // We'll plot up to n=50
      const spacing = width / maxDelay;
      
      const drawStem = (n: number, val: number, color: string, offset: number) => {
        if (n < 0 || n >= maxDelay || val === 0) return;
        const x = spacing * n + offset;
        const h = (val / 1.5) * (height / 2); // scale by 1.5 max
        
        ctx.fillStyle = color;
        ctx.fillRect(x - 2, zeroY - (val >= 0 ? h : 0), 4, Math.abs(h));
        
        ctx.beginPath();
        ctx.arc(x, zeroY - h, 3, 0, Math.PI * 2);
        ctx.fill();
      };

      // Both have a spike at n=0 (the direct path signal)
      drawStem(0, 1.0, cssVar('--c-canvas-bar-true'), -2);
      drawStem(0, 1.0, cssVar('--c-canvas-bar-est'), 2);

      // True echo
      drawStem(trueDelay, trueAlpha, cssVar('--c-canvas-bar-true'), -2);
      
      // Estimated echo
      drawStem(estDelay, estAlpha, cssVar('--c-canvas-bar-est'), 2);

      // Label
      ctx.fillStyle = cssVar('--c-canvas-label');
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Impulse Response: h[n] vs ĥ[n]', 10, 18);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [trueAlpha, trueDelay, estAlpha, estDelay]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-panel backdrop-blur-md border border-border shadow-glass">
      <canvas ref={canvasRef} width={600} height={250} className="w-full h-full object-fill" />
    </div>
  );
};
