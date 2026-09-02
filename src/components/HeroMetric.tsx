import React from 'react';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface HeroMetricProps {
  erle: number;
  alphaErr: number;
  delayErr: number;
  cancellerOn: boolean;
}

export const HeroMetric: React.FC<HeroMetricProps> = ({ erle, alphaErr, delayErr, cancellerOn }) => {
  const isExcellent = erle > 15;
  const isGood = erle > 5;
  
  let status = 'idle';
  if (cancellerOn) {
    if (delayErr === 0 && alphaErr < 0.05) status = 'converged';
    else if (delayErr === 0) status = 'partial';
    else status = 'mismatch';
  }

  const STATUS_CONFIG: any = {
    converged: { label: 'Aligned', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)', Icon: CheckCircle2 },
    partial:   { label: 'Gain Error',  color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.35)',  Icon: Activity },
    mismatch:  { label: 'Mismatch', color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.35)', Icon: AlertTriangle },
    idle:      { label: 'Off',      color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', Icon: Activity },
  };

  const erleColor  = isExcellent ? '#a78bfa' : isGood ? '#c4b5fd' : '#fb7185';
  const glowColor  = isExcellent ? 'rgba(167,139,250,0.4)' : isGood ? 'rgba(167,139,250,0.15)' : 'rgba(251,113,133,0.3)';
  const { label, color, bg, border, Icon } = STATUS_CONFIG[status];

  return (
    <div
      className="relative flex items-center gap-5 h-full rounded-xl border border-border/25 px-5 overflow-hidden shadow-glass"
      style={{ background: 'rgb(var(--c-panel) / 0.85)', backdropFilter: 'blur(16px)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{ background: `radial-gradient(ellipse 50% 100% at 15% 50%, ${glowColor}, transparent 70%)` }}
      />
      <div className="absolute inset-0 opacity-[0.02] bg-[repeating-linear-gradient(transparent,transparent_2px,#fff_2px,#fff_4px)] pointer-events-none" />

      {/* ERLE */}
      <div className="flex items-center gap-4 z-10">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-0.5">
            <Activity size={11} className="text-muted" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted">ERLE</span>
          </div>
          <div
            className="font-mono font-bold leading-none tracking-tighter transition-colors duration-300"
            style={{ fontSize: '4rem', color: erleColor, textShadow: `0 0 20px ${glowColor}` }}
          >
            {isFinite(erle) ? erle.toFixed(1) : '∞'}
          </div>
          <div className="text-xs font-mono text-muted mt-0.5">dB · Echo Removal</div>
        </div>

        <div className="h-12 w-px bg-border/25 self-center" />

        {/* Param Errors */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex justify-between items-center w-24">
            <span className="text-xs font-mono text-muted uppercase">Δ Delay</span>
            <span className={`text-lg font-mono font-bold ${delayErr === 0 ? 'text-trace1' : 'text-trace3'}`}>{delayErr}</span>
          </div>
          <div className="flex justify-between items-center w-24">
            <span className="text-xs font-mono text-muted uppercase">Δ Atten</span>
            <span className={`text-lg font-mono font-bold ${alphaErr < 0.05 ? 'text-trace1' : 'text-trace3'}`}>{alphaErr.toFixed(2)}</span>
          </div>
        </div>

        <div className="h-12 w-px bg-border/25 self-center" />

        {/* Status */}
        <div className="flex flex-col items-center z-10">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted mb-1.5">Model Status</div>
          <div
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-mono font-bold text-xs transition-all duration-500"
            style={{ color, backgroundColor: bg, borderColor: border }}
          >
            <Icon size={13} />
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};
