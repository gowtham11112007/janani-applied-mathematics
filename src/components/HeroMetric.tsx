import React from 'react';
import { Activity, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface HeroMetricProps {
  erle: number;
  l2norm: number;
  status: 'converged' | 'adapting' | 'diverging' | 'idle';
}

const STATUS_CONFIG = {
  converged: { label: 'Converged', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)', Icon: TrendingDown },
  adapting:  { label: 'Adapting',  color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.35)',  Icon: TrendingDown },
  diverging: { label: 'Diverging', color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.35)', Icon: TrendingUp },
  idle:      { label: 'Idle',      color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', Icon: Minus },
};

export const HeroMetric: React.FC<HeroMetricProps> = ({ erle, l2norm, status }) => {
  const isExcellent = erle > 10;
  const isGood = erle > 3;
  const erleColor  = isExcellent ? '#a78bfa' : isGood ? '#c4b5fd' : '#fb7185';
  const glowColor  = isExcellent ? 'rgba(167,139,250,0.4)' : isGood ? 'rgba(167,139,250,0.15)' : 'rgba(251,113,133,0.3)';

  const { label: statusLabel, color: statusColor, bg: statusBg, border: statusBorder, Icon: StatusIcon } = STATUS_CONFIG[status];

  return (
    <div
      className="relative flex items-center gap-5 h-full rounded-xl border border-border/25 px-5 overflow-hidden shadow-glass"
      style={{ background: 'rgb(var(--c-panel) / 0.85)', backdropFilter: 'blur(16px)' }}
    >
      {/* Background bloom */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{ background: `radial-gradient(ellipse 50% 100% at 15% 50%, ${glowColor}, transparent 70%)` }}
      />
      {/* Subtle scan lines */}
      <div className="absolute inset-0 opacity-[0.02] bg-[repeating-linear-gradient(transparent,transparent_2px,#fff_2px,#fff_4px)] pointer-events-none" />

      {/* ── ERLE ─────────────────────────────────────── */}
      <div className="flex items-center gap-4 z-10">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-0.5">
            <Activity size={11} className="text-muted" />
            <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-muted">ERLE</span>
          </div>
          <div
            className="font-mono font-bold leading-none tracking-tighter transition-colors duration-300"
            style={{ fontSize: '3rem', color: erleColor, textShadow: `0 0 20px ${glowColor}` }}
          >
            {isFinite(erle) ? erle.toFixed(1) : '∞'}
          </div>
          <div className="text-[8px] font-mono text-muted mt-0.5">dB · target &gt; 10</div>
        </div>

        <div className="h-12 w-px bg-border/25 self-center" />

        {/* ── L2 Norm ──────────────────────────────────── */}
        <div className="flex flex-col items-center">
          <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-muted mb-0.5">||h − ŵ||₂</div>
          <div className="font-mono font-bold leading-none tracking-tighter text-trace4 transition-all duration-300" style={{ fontSize: '2.6rem' }}>
            {isFinite(l2norm) ? l2norm.toFixed(3) : '—'}
          </div>
          <div className="text-[8px] font-mono text-muted mt-0.5">L2 error · goal → 0</div>
        </div>

        <div className="h-12 w-px bg-border/25 self-center" />

        {/* ── Status ───────────────────────────────────── */}
        <div className="flex flex-col items-center z-10">
          <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-muted mb-1.5">Filter Status</div>
          <div
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-mono font-bold text-xs transition-all duration-500"
            style={{ color: statusColor, backgroundColor: statusBg, borderColor: statusBorder }}
          >
            <StatusIcon size={13} />
            {statusLabel}
          </div>
        </div>
      </div>

      {/* Right decorative accent */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 rounded-r-xl opacity-40"
        style={{ background: `linear-gradient(to bottom, ${statusColor}, transparent)` }}
      />
    </div>
  );
};
