import React, { useRef, useEffect } from 'react';

interface MagnitudeResponseProps {
  trueAlpha: number;
  trueDelay: number;
  estAlpha: number;
  estDelay: number;
}

const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const MagnitudeResponse: React.FC<MagnitudeResponseProps> = ({
  trueAlpha, trueDelay, estAlpha, estDelay
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const resolution = 256;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = cssVar('--c-canvas-grid');
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += width / 4) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      for (let y = 0; y <= height; y += height / 4) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      ctx.stroke();

      const drawResponse = (alpha: number, delay: number, color: string, lineWidth: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        
        for (let i = 0; i <= resolution; i++) {
          const w = (Math.PI * i) / resolution; // 0 to pi
          // |H(e^jw)| = sqrt(1 + a^2 + 2a*cos(w*D))
          const mag = Math.sqrt(1 + alpha * alpha + 2 * alpha * Math.cos(w * delay));
          
          // Max possible magnitude is 1 + |alpha| (usually <= 2.0)
          const maxMag = 2.0; 
          
          const x = (i / resolution) * width;
          const y = height - (mag / maxMag) * height;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      drawResponse(trueAlpha, trueDelay, cssVar('--c-canvas-bar-true'), 3);
      if (estAlpha !== 0) {
        drawResponse(estAlpha, estDelay, cssVar('--c-canvas-bar-est'), 2);
      }

      ctx.fillStyle = cssVar('--c-canvas-label');
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Magnitude Response |H(e^jω)|', 10, 18);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [trueAlpha, trueDelay, estAlpha, estDelay]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-panel backdrop-blur-md border border-border shadow-glass">
      <canvas ref={canvasRef} width={400} height={250} className="w-full h-full object-fill" />
    </div>
  );
};
