import React, { useRef, useEffect } from 'react';

const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

interface PoleZeroPlotProps {
  trueTaps: number[];
  estimatedTaps: number[];
}

function computeRoots(taps: number[]): { re: number; im: number }[] {
  // Companion matrix method — finds roots of polynomial defined by taps
  const N = taps.length;
  if (N === 0 || taps[0] === 0) return [];

  // Normalize leading coefficient
  const a = taps.map(t => t / taps[0]);

  // Build companion matrix and extract eigenvalues via power iteration / QR
  // For simplicity with small N (≤5), use direct companion matrix
  // We'll use a simple iterative Durand-Kerner method for polynomial roots
  const degree = N - 1;
  if (degree <= 0) return [];

  // Monic polynomial: z^N + a1*z^(N-1) + ... + aN = 0
  // Durand-Kerner initialization
  const roots: { re: number; im: number }[] = [];
  for (let k = 0; k < degree; k++) {
    const angle = (2 * Math.PI * k) / degree;
    roots.push({ re: 0.4 * Math.cos(angle), im: 0.4 * Math.sin(angle) });
  }

  // Evaluate polynomial at complex point
  const polyEval = (z: { re: number; im: number }) => {
    let re = 1, im = 0;
    for (let i = 1; i < a.length; i++) {
      // Multiply by z: (re + im*j) * (z.re + z.im*j)
      const newRe = re * z.re - im * z.im;
      const newIm = re * z.im + im * z.re;
      re = newRe + (i < a.length - 1 ? 0 : a[i]);
      im = newIm;
      if (i < a.length - 1) {
        re += 0;
        im += 0;
      }
    }
    // Actually redo properly
    let rRe = a[0], rIm = 0;
    for (let i = 1; i < a.length; i++) {
      const nr = rRe * z.re - rIm * z.im + a[i];
      const ni = rRe * z.im + rIm * z.re;
      rRe = nr; rIm = ni;
    }
    return { re: rRe, im: rIm };
  };

  // 50 iterations of Durand-Kerner
  for (let iter = 0; iter < 50; iter++) {
    for (let i = 0; i < degree; i++) {
      const pz = polyEval(roots[i]);
      let denom = { re: 1, im: 0 };
      for (let j = 0; j < degree; j++) {
        if (j !== i) {
          const diffRe = roots[i].re - roots[j].re;
          const diffIm = roots[i].im - roots[j].im;
          const nr = denom.re * diffRe - denom.im * diffIm;
          const ni = denom.re * diffIm + denom.im * diffRe;
          denom = { re: nr, im: ni };
        }
      }
      const denomMag2 = denom.re * denom.re + denom.im * denom.im;
      if (denomMag2 < 1e-20) continue;
      const quotRe = (pz.re * denom.re + pz.im * denom.im) / denomMag2;
      const quotIm = (pz.im * denom.re - pz.re * denom.im) / denomMag2;
      roots[i].re -= quotRe;
      roots[i].im -= quotIm;
    }
  }

  return roots;
}

export const PoleZeroPlot: React.FC<PoleZeroPlotProps> = ({ trueTaps, estimatedTaps }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const radius = Math.min(cx, cy) * 0.75;

      // Grid circles
      ctx.strokeStyle = cssVar('--c-canvas-grid');
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1.0].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * r, 0, 2 * Math.PI);
        ctx.stroke();
      });

      // Axes
      ctx.strokeStyle = cssVar('--c-canvas-zeroline');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radius * 1.15, cy); ctx.lineTo(cx + radius * 1.15, cy);
      ctx.moveTo(cx, cy - radius * 1.15); ctx.lineTo(cx, cy + radius * 1.15);
      ctx.stroke();

      // Unit circle (with glow)
      ctx.shadowColor = 'rgba(232, 121, 249, 0.4)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // FIR zeros: all poles at origin (Z-transform theory)
      // Draw origin pole marker (×) for both
      const drawPole = (x: number, y: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        const s = 6;
        ctx.beginPath();
        ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
        ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
        ctx.stroke();
      };

      const drawZero = (x: number, y: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.stroke();
      };

      // True zeros of H(z)
      const trueRoots = computeRoots(trueTaps);
      trueRoots.forEach(({ re, im }) => {
        const px = cx + re * radius;
        const py = cy - im * radius;
        drawZero(px, py, 'rgba(167, 139, 202, 0.6)');
      });

      // Estimated zeros of Ĥ(z)
      const estRoots = computeRoots(estimatedTaps);
      estRoots.forEach(({ re, im }) => {
        const px = cx + re * radius;
        const py = cy - im * radius;
        drawZero(px, py, '#e879f9');
      });

      // All poles at origin for FIR
      drawPole(cx, cy, 'rgba(251, 113, 133, 0.8)');

      // Labels
      ctx.fillStyle = cssVar('--c-canvas-label');
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('Pole-Zero: H(z)', 10, 20);

      ctx.font = '9px "JetBrains Mono"';
      ctx.fillStyle = cssVar('--c-canvas-legend');
      ctx.fillText('+j', cx + 4, cy - radius - 4);
      ctx.fillText('-j', cx + 4, cy + radius + 12);
      ctx.fillText('1', cx + radius + 3, cy - 4);
      ctx.fillText('-1', cx - radius - 18, cy - 4);

      // Legend
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillStyle = cssVar('--c-canvas-legend');
      ctx.fillText('○ True zeros', W - 90, 20);
      ctx.fillStyle = '#e879f9';
      ctx.fillText('○ Est zeros', W - 90, 36);
      ctx.fillStyle = '#fb7185';
      ctx.fillText('× Poles (origin)', W - 100, 52);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [trueTaps, estimatedTaps]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-panel backdrop-blur-md border border-border shadow-glass">
      <canvas ref={canvasRef} width={400} height={250} className="w-full h-full object-fill" />
    </div>
  );
};
