import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KSpanProps { math: string; }
const K: React.FC<KSpanProps> = ({ math }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) katex.render(math, ref.current, { throwOnError: false, displayMode: false });
  }, [math]);
  return <span ref={ref} className="text-base" />;
};

interface SystemEquationsProps {
  trueAlpha: number;
  trueDelay: number;
  estAlpha: number;
  estDelay: number;
  erle: number;
}

const EqCard: React.FC<{ label: string; math: string; children?: React.ReactNode }> = ({ label, math, children }) => (
  <div
    className="flex flex-col justify-between flex-1 min-w-0 rounded-lg border border-border/20 px-3 py-2"
    style={{ background: 'rgb(var(--c-panel-solid) / 0.6)' }}
  >
    <div className="text-xs font-mono uppercase tracking-widest text-muted mb-1">{label}</div>
    <div className="flex items-center justify-center overflow-hidden">
      <K math={math} />
    </div>
    {children && <div className="mt-1.5 border-t border-border/15 pt-1.5">{children}</div>}
  </div>
);

const LiveVal: React.FC<{ label: string; value: string; colorClass: string }> = ({ label, value, colorClass }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-xs font-mono text-muted">{label}</span>
    <span className={`text-sm font-mono font-bold ${colorClass}`}>{value}</span>
  </div>
);

export const SystemEquations: React.FC<SystemEquationsProps> = ({ trueAlpha, trueDelay, estAlpha, estDelay, erle }) => {
  const alphaErr = Math.abs(trueAlpha - estAlpha);
  const delayErr = Math.abs(trueDelay - estDelay);

  return (
    <div
      className="flex items-stretch gap-2.5 rounded-xl border border-border/20 p-2.5 shadow-glass"
      style={{ background: 'rgb(var(--c-panel) / 0.8)', backdropFilter: 'blur(16px)' }}
    >
      <div className="flex flex-col items-center justify-center px-2 border-r border-border/15 pr-3 min-w-max">
        <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted rotate-[-90deg] whitespace-nowrap">
          System Eqs
        </span>
      </div>

      <EqCard label="Room Z-Transform" math="H(z) = 1 + \alpha z^{-D}" />

      <EqCard label="Canceller Model" math="\hat{y}[n] = \hat{\alpha} \cdot x[n - \hat{D}]" />

      <EqCard label="Error Signal" math="E(z) = D(z) - \hat{Y}(z)">
        <div className="flex items-center justify-center gap-4">
          <LiveVal label="Δα" value={alphaErr.toFixed(2)} colorClass={alphaErr < 0.05 ? 'text-trace1' : 'text-trace3'} />
          <LiveVal label="ΔD" value={String(delayErr)} colorClass={delayErr === 0 ? 'text-trace1' : 'text-trace3'} />
        </div>
      </EqCard>

      <EqCard label="ERLE" math="\text{ERLE}=10\log_{10}\!\frac{\mathbb{E}[d^2]}{\mathbb{E}[e^2]}">
        <LiveVal label="Live" value={erle.toFixed(1) + ' dB'} colorClass={erle > 10 ? 'text-trace1' : 'text-muted'} />
      </EqCard>
    </div>
  );
};
