import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KSpanProps { math: string; }
const K: React.FC<KSpanProps> = ({ math }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) katex.render(math, ref.current, { throwOnError: false, displayMode: false });
  }, [math]);
  return <span ref={ref} className="text-[10px]" />;
};

interface SystemEquationsProps {
  mu: number;
  muMax: number;
  numTaps: number;
  erle: number;
  l2norm: number;
}

// A compact equation card
const EqCard: React.FC<{ label: string; math: string; children?: React.ReactNode }> = ({ label, math, children }) => (
  <div
    className="flex flex-col justify-between flex-1 min-w-0 rounded-lg border border-border/20 px-3 py-2"
    style={{ background: 'rgb(var(--c-panel-solid) / 0.6)' }}
  >
    <div className="text-[8px] font-mono uppercase tracking-widest text-muted mb-1">{label}</div>
    <div className="flex items-center justify-center overflow-hidden">
      <K math={math} />
    </div>
    {children && <div className="mt-1.5 border-t border-border/15 pt-1.5">{children}</div>}
  </div>
);

// A live value badge
const LiveVal: React.FC<{ label: string; value: string; colorClass: string }> = ({ label, value, colorClass }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-[8px] font-mono text-muted">{label}</span>
    <span className={`text-[10px] font-mono font-bold ${colorClass}`}>{value}</span>
  </div>
);

export const SystemEquations: React.FC<SystemEquationsProps> = ({ mu, muMax, numTaps, erle, l2norm }) => {
  const isDiverging = mu > muMax && muMax > 0;

  return (
    <div
      className="flex items-stretch gap-2.5 rounded-xl border border-border/20 p-2.5 shadow-glass"
      style={{ background: 'rgb(var(--c-panel) / 0.8)', backdropFilter: 'blur(16px)' }}
    >
      {/* Label */}
      <div className="flex flex-col items-center justify-center px-2 border-r border-border/15 pr-3 min-w-max">
        <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-muted rotate-[-90deg] whitespace-nowrap">
          System Eqs
        </span>
      </div>

      {/* Equation cards */}
      <EqCard label="Room IR (FIR)" math="H(z)=\sum_{k=0}^{N-1}h_k z^{-k}" />

      <EqCard label="LMS Update" math="\hat{w}[n+1]=\hat{w}[n]+\mu\,e[n]\,x[n]">
        <LiveVal label="μ" value={mu.toFixed(4)} colorClass={isDiverging ? 'text-trace3' : 'text-accent'} />
      </EqCard>

      <EqCard label="ERLE" math="\text{ERLE}=10\log_{10}\!\frac{\mathbb{E}[d^2]}{\mathbb{E}[e^2]}\ \text{dB}">
        <LiveVal label="live" value={erle.toFixed(1) + ' dB'} colorClass={erle > 10 ? 'text-trace1' : 'text-muted'} />
      </EqCard>

      <EqCard label="Stability" math="0<\mu<\frac{2}{N\cdot\mathbb{E}[x^2]}">
        <div className="flex items-center justify-between gap-2">
          <LiveVal label="μ_max" value={muMax.toFixed(3)} colorClass="text-trace4" />
          <LiveVal label="N" value={String(numTaps)} colorClass="text-primary" />
          {isDiverging && <span className="text-[8px] font-mono text-trace3 font-bold">⚠ UNSTABLE</span>}
        </div>
      </EqCard>

      <EqCard label="L2 Error" math="\|\mathbf{h}-\hat{\mathbf{w}}\|_2">
        <LiveVal label="live" value={l2norm.toFixed(4)} colorClass={l2norm < 0.05 ? 'text-trace1' : 'text-muted'} />
      </EqCard>
    </div>
  );
};
