import React from 'react';
import { Play, Pause, RotateCcw, Activity, Wand2, ArrowRightCircle } from 'lucide-react';
import { Fader } from './Fader';

interface ControlRailProps {
  trueDelay: number;
  setTrueDelay: (val: number) => void;
  trueAlpha: number;
  setTrueAlpha: (val: number) => void;
  estDelay: number;
  estAlpha: number;
  cancellerOn: boolean;
  setCancellerOn: (val: boolean) => void;
  adaptiveMode: boolean;
  setAdaptiveMode: (val: boolean) => void;
  playing: boolean;
  setPlaying: (val: boolean) => void;
  reset: () => void;
}

const SectionLabel: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <span className="text-accent opacity-70">{icon}</span>
    <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-semibold">{label}</span>
  </div>
);

const Divider = () => <div className="h-px bg-border opacity-30 my-1" />;

export const ControlRail: React.FC<ControlRailProps> = ({
  trueDelay, setTrueDelay,
  trueAlpha, setTrueAlpha,
  estDelay,
  estAlpha,
  cancellerOn, setCancellerOn,
  adaptiveMode, setAdaptiveMode,
  playing, setPlaying,
  reset,
}) => {
  

  return (
    <aside
      className="w-72 shrink-0 h-screen flex flex-col border-r border-border/30 shadow-glass relative z-10"
      style={{ background: 'rgb(var(--c-panel) / 0.9)', backdropFilter: 'blur(24px)' }}
    >
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border/20">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-trace4 flex items-center justify-center shadow-neon-teal">
          <Activity size={16} className="text-white" />
        </div>
        <div>
          <div className="text-primary font-bold text-lg leading-tight">Z-Transform Echo</div>
          <div className="text-muted text-xs font-mono tracking-widest uppercase">Janani Capstone</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-0 px-4 py-3 overflow-hidden">
        
        {/* PLAYBACK */}
        <div className="shrink-0">
          <SectionLabel icon={<Play size={11} />} label="Playback" />
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPlaying(!playing)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-mono font-bold text-sm transition-all ${
                playing ? 'bg-trace2/15 text-trace2 border border-trace2/30 hover:bg-trace2/25'
                        : 'bg-accent/15 text-accent border border-accent/35 hover:bg-accent/25'
              }`}
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center w-9 rounded-lg bg-panelSolid border border-border/30 hover:border-accent/40 text-muted hover:text-accent transition-all"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        <Divider />

{/* ROOM MODEL */}
        <div className="shrink-0 py-3">
          <SectionLabel icon={<Activity size={11} />} label="Actual Room (Echo Path)" />
          <p className="text-[10px] text-muted/70 mb-3 leading-snug px-1">
            <b>Hint:</b> Change these to simulate the physical room. The filter will have to adapt!
          </p>
          <div className="flex flex-col gap-2">
            <Fader
              label="Echo Delay (N)"
              value={trueDelay} min={1} max={40} step={1}
              onChange={setTrueDelay}
              accentClass="accent-trace2"
            />
            <Fader
              label="Echo Attenuation (α)"
              value={trueAlpha} min={-1} max={1} step={0.05}
              onChange={setTrueAlpha}
              accentClass="accent-trace2"
            />
          </div>
        </div>

        <Divider />

{/* ESTIMATION MODULE */}
        <div className="flex-1 flex flex-col py-3">
          <div className="flex items-center justify-between mb-2">
            <SectionLabel icon={<Wand2 size={11} />} label="Echo Estimator & Canceller" />
            <button
              onClick={() => setCancellerOn(!cancellerOn)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-mono font-bold uppercase transition-all ${
                cancellerOn ? 'bg-accent/15 border-accent/40 text-accent'
                            : 'bg-border/10 border-border/25 text-muted'
              }`}
            >
              {cancellerOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <p className="text-[10px] text-muted/70 mb-3 leading-snug px-1 mt-2">
            <b>Hint:</b> The LMS algorithm continuously updates its coefficients to reduce the error.
          </p>

          
          <div className="flex flex-col gap-2 mb-4">
            
            <div className="flex flex-col gap-3 mb-4 p-3 rounded-lg bg-panelSolid border border-border/20">
            <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">Adaptive Filter Estimates</div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-muted">Est. Delay (N̂)</span>
              <span className="text-sm font-mono font-bold text-trace4">{estDelay}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-muted">Est. Atten (α̂)</span>
              <span className="text-sm font-mono font-bold text-trace4">{estAlpha.toFixed(2)}</span>
            </div>
          </div>
          </div>

          <button
            onClick={() => setAdaptiveMode(!adaptiveMode)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border transition-all font-mono text-sm font-bold uppercase ${
              adaptiveMode 
                ? 'bg-accent/20 border-accent/60 text-accent shadow-neon-accent'
                : 'bg-panelSolid border-border/30 hover:border-accent/50 text-muted hover:text-primary'
            }`}
          >
            <ArrowRightCircle size={14} className={adaptiveMode ? "text-accent animate-pulse" : "text-muted"} />
            {adaptiveMode ? 'LMS Adaptive Mode ON' : 'Enable LMS Adaptive Filter'}
          </button>
        </div>

      </div>
    </aside>
  );
};
