import React from 'react';
import { Play, Pause, RotateCcw, Power, Settings2, SlidersHorizontal, Activity, Layers, Download } from 'lucide-react';
import { Fader } from './Fader';

// ─── Presets ────────────────────────────────────────────────────────────────────
export const PRESETS = {
  'Ideal Room': {
    taps: [0.5, 0.0, 0.0, 0.0, 0.0],
    mu: 0.01,
    noiseLevel: 0.0,
    label: 'Ideal Room',
    description: 'Single reflection, clean signal',
  },
  'Noisy Room': {
    taps: [0.8, -0.4, 0.2, 0.1, -0.05],
    mu: 0.008,
    noiseLevel: 0.15,
    label: 'Noisy Room',
    description: 'Multi-tap echo + ambient noise',
  },
  'Long Reverb': {
    taps: [0.6, 0.5, 0.4, 0.3, 0.2],
    mu: 0.005,
    noiseLevel: 0.05,
    label: 'Long Reverb',
    description: 'Dense reverb tail',
  },
  'Diverging (μ too large)': {
    taps: [0.8, -0.4, 0.2, 0.1, -0.05],
    mu: 0.048,
    noiseLevel: 0.05,
    label: 'Diverging',
    description: 'μ exceeds stability bound!',
  },
} as const;

export type PresetName = keyof typeof PRESETS;

// ─── Props ──────────────────────────────────────────────────────────────────────
interface ControlRailProps {
  mu: number;
  setMu: (val: number) => void;
  muMax: number;
  noiseLevel: number;
  setNoiseLevel: (val: number) => void;
  cancellerOn: boolean;
  setCancellerOn: (val: boolean) => void;
  playing: boolean;
  setPlaying: (val: boolean) => void;
  narrativeState: number;
  setNarrativeState: (val: number) => void;
  reset: () => void;
  taps: number[];
  setTap: (index: number, val: number) => void;
  onPreset: (preset: PresetName) => void;
  onExport: () => void;
}

// ─── Section Label ───────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <span className="text-accent opacity-70">{icon}</span>
    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted font-semibold">{label}</span>
  </div>
);

// ─── Divider ─────────────────────────────────────────────────────────────────────
const Divider = () => (
  <div className="h-px bg-border opacity-30 my-1" />
);

// ─── Component ──────────────────────────────────────────────────────────────────
export const ControlRail: React.FC<ControlRailProps> = ({
  mu, setMu, muMax,
  noiseLevel, setNoiseLevel,
  cancellerOn, setCancellerOn,
  playing, setPlaying,
  narrativeState, setNarrativeState,
  reset,
  taps, setTap,
  onPreset, onExport,
}) => {
  const narrativeLabels = [
    'Manual Mode',
    '1 · Clean Signal',
    '2 · Echo Appears',
    '3 · Canceller Adapting',
    '4 · Converged ✓',
  ];

  const isDiverging = mu > muMax && muMax > 0;

  return (
    <aside
      className="w-72 shrink-0 h-screen flex flex-col border-r border-border/30 shadow-glass relative z-10"
      style={{ background: 'rgb(var(--c-panel) / 0.9)', backdropFilter: 'blur(24px)' }}
    >
      {/* ── Brand Header ────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border/20">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-trace4 flex items-center justify-center shadow-neon-teal">
          <Activity size={16} className="text-white" />
        </div>
        <div>
          <div className="text-primary font-bold text-sm leading-tight">EchoCanceller</div>
          <div className="text-muted text-[9px] font-mono tracking-widest uppercase">DSP Lab · LMS Adaptive</div>
        </div>
      </div>

      {/* ── Scrollable Body ──────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-0 px-4 py-3 overflow-hidden">

        {/* ── PLAYBACK ────────────────────────────────────── */}
        <div className="shrink-0">
          <SectionLabel icon={<Play size={11} />} label="Playback" />
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPlaying(!playing)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-mono font-bold text-[11px] transition-all ${
                playing
                  ? 'bg-trace2/15 text-trace2 border border-trace2/30 hover:bg-trace2/25'
                  : 'bg-accent/15 text-accent border border-accent/35 hover:bg-accent/25'
              }`}
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={reset}
              title="Reset Filter"
              className="flex items-center justify-center w-9 rounded-lg bg-panelSolid border border-border/30 hover:border-accent/40 text-muted hover:text-accent transition-all"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={onExport}
              title="Export PNG"
              className="flex items-center justify-center w-9 rounded-lg bg-panelSolid border border-border/30 hover:border-accent/40 text-muted hover:text-accent transition-all"
            >
              <Download size={13} />
            </button>
          </div>
        </div>

        <Divider />

        {/* ── SEQUENCER ───────────────────────────────────── */}
        <div className="shrink-0 py-2">
          <SectionLabel icon={<Layers size={11} />} label="Presentation Sequencer" />
          <div className="rounded-xl border border-border/25 bg-panelSolid/60 px-3 py-2.5 relative overflow-hidden">
            {/* accent side bar */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent to-trace4" />
            <div className="flex items-center justify-between mb-2 pl-1">
              <div className="flex gap-1">
                {[0,1,2,3,4].map(i => (
                  <button
                    key={i}
                    onClick={() => setNarrativeState(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === narrativeState
                        ? 'bg-accent scale-125'
                        : 'bg-border/40 hover:bg-border'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[9px] font-mono text-muted">{narrativeState}/4</span>
            </div>
            <div className="text-[11px] font-semibold text-primary mb-2 pl-1 leading-tight">
              {narrativeLabels[narrativeState]}
            </div>
            <button
              onClick={() => setNarrativeState((narrativeState + 1) % 5)}
              className="w-full py-1 rounded-lg border border-accent/35 text-accent hover:bg-accent hover:text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              Next Scene →
            </button>
          </div>
        </div>

        <Divider />

        {/* ── PRESETS ─────────────────────────────────────── */}
        <div className="shrink-0 py-2">
          <SectionLabel icon={<Layers size={11} />} label="Presets" />
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(PRESETS) as PresetName[]).map(name => {
              const p = PRESETS[name];
              const isDivPreset = name === 'Diverging (μ too large)';
              return (
                <button
                  key={name}
                  onClick={() => onPreset(name)}
                  className={`flex flex-col text-left px-2.5 py-1.5 rounded-lg border text-[9px] font-mono transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    isDivPreset
                      ? 'border-trace3/35 bg-trace3/8 text-trace3 hover:bg-trace3/15'
                      : 'border-border/25 bg-panelSolid/50 text-muted hover:text-primary hover:border-accent/40 hover:bg-accent/5'
                  }`}
                >
                  <span className="font-bold text-[10px] leading-tight">{p.label}</span>
                  <span className="opacity-60 mt-0.5 leading-tight text-[9px]">{p.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* ── ENVIRONMENT ─────────────────────────────────── */}
        <div className="shrink-0 py-2">
          <div className="flex items-center justify-between mb-2">
            <SectionLabel icon={<Settings2 size={11} />} label="Environment" />
            <button
              onClick={() => setCancellerOn(!cancellerOn)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-mono font-bold uppercase transition-all ${
                cancellerOn
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'bg-border/10 border-border/25 text-muted'
              }`}
            >
              <Power size={9} />
              LMS {cancellerOn ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* μ slider */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] font-mono text-muted uppercase tracking-widest">Step Size (μ)</label>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                isDiverging
                  ? 'text-trace3 border-trace3/40 bg-trace3/10'
                  : 'text-primary border-border/30 bg-panelSolid/60'
              }`}>
                {mu.toFixed(4)}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0" max="0.05" step="0.0005"
                value={mu}
                onChange={e => setMu(parseFloat(e.target.value))}
                className="w-full"
              />
              {muMax > 0 && muMax < 0.05 && (
                <div
                  className="absolute top-0 h-full flex items-center pointer-events-none"
                  style={{ left: `${Math.min((muMax / 0.05) * 100, 100)}%` }}
                >
                  <div className="w-px h-3.5 bg-trace3 opacity-80 -translate-x-px" />
                </div>
              )}
            </div>
            <div className="flex justify-between text-[9px] font-mono text-muted mt-0.5">
              <span>0</span>
              {muMax > 0 && muMax < 0.05 && (
                <span className="text-trace3">μ_max={muMax.toFixed(3)}</span>
              )}
              <span className={isDiverging ? 'text-trace3 font-bold' : ''}>
                {isDiverging ? '⚠ UNSTABLE' : '0.05'}
              </span>
            </div>
          </div>

          <Fader
            label="Noise Level"
            value={noiseLevel} min={0} max={0.5} step={0.01}
            onChange={setNoiseLevel}
            accentClass="accent-trace2"
          />
        </div>

        <Divider />

        {/* ── ROOM IMPULSE RESPONSE ─────────────────────── */}
        <div className="flex-1 flex flex-col py-2 min-h-0">
          <SectionLabel icon={<SlidersHorizontal size={11} />} label="Room IR  h[k]" />
          <div className="flex-1 flex flex-col justify-between gap-0.5">
            {taps.map((val, idx) => (
              <Fader
                key={idx}
                label={`h[${idx}]`}
                value={val} min={-1} max={1} step={0.05}
                onChange={(v) => setTap(idx, v)}
                accentClass="accent-trace4"
              />
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
};
