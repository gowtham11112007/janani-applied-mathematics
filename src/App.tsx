import { useState, useEffect, useRef, useCallback } from 'react';
import { ControlRail, PRESETS } from './components/ControlRail';
import type { PresetName } from './components/ControlRail';
import { OscilloscopePlot } from './components/OscilloscopePlot';
import { TapWeightsPlot } from './components/TapWeightsPlot';
import { MagnitudeResponse } from './components/MagnitudeResponse';
import { PoleZeroPlot } from './components/PoleZeroPlot';
import { HeroMetric } from './components/HeroMetric';
import { SystemEquations } from './components/SystemEquations';
import { SignalGenerator, EchoPath, LMSFilter, MetricCalculator, computeL2Norm } from './dsp/EchoCanceller';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────────
const NUM_TAPS = 5;
const PLOT_SAMPLES = 512;
const SAMPLES_PER_FRAME = 8;
const STATUS_WINDOW = 80;

// ─── Inner app (has access to ThemeContext) ───────────────────────────────────
function EchoApp() {
  const { theme, toggle: toggleTheme } = useTheme();

  // ── UI State ────────────────────────────────────────────────────────────────
  const [playing, setPlaying]         = useState(true);
  const [cancellerOn, setCancellerOn] = useState(true);
  const [mu, setMu]                   = useState(0.01);
  const [noiseLevel, setNoiseLevel]   = useState(0.05);
  const [taps, setTaps]               = useState([0.8, -0.4, 0.2, 0.1, -0.05]);
  const [narrativeState, setNarrativeState] = useState(0);

  // ── Computed Metrics ─────────────────────────────────────────────────────────
  const [erle, setErle]     = useState(0);
  const [l2norm, setL2norm] = useState(0);
  const [muMax, setMuMax]   = useState(0.05);
  const [status, setStatus] = useState<'converged' | 'adapting' | 'diverging' | 'idle'>('idle');

  // ── Status classification history ────────────────────────────────────────────
  const errorHistory = useRef<number[]>([]);

  // ── Plot buffers (refs — avoid React re-render on every frame) ───────────────
  const plotData = useRef({
    x:    new Float32Array(PLOT_SAMPLES),
    d:    new Float32Array(PLOT_SAMPLES),
    yHat: new Float32Array(PLOT_SAMPLES),
    e:    new Float32Array(PLOT_SAMPLES),
  });

  // ── DSP instances (refs — stable across renders) ─────────────────────────────
  const dsp = useRef({
    sigGen:   new SignalGenerator(),
    echoPath: new EchoPath(taps),
    lms:      new LMSFilter(NUM_TAPS, mu),
    metric:   new MetricCalculator(),
  });

  // ── Sync parameters into DSP refs ────────────────────────────────────────────
  useEffect(() => { dsp.current.lms.mu = mu; }, [mu]);
  useEffect(() => { dsp.current.echoPath.setTaps(taps); }, [taps]);

  // ── Narrative Mode ───────────────────────────────────────────────────────────
  useEffect(() => {
    switch (narrativeState) {
      case 1:
        setTaps([0, 0, 0, 0, 0]);
        setNoiseLevel(0.0);
        setCancellerOn(false);
        break;
      case 2:
        setTaps([0.8, -0.4, 0.2, 0.1, -0.05]);
        setNoiseLevel(0.05);
        setCancellerOn(false);
        break;
      case 3:
        setCancellerOn(true);
        setMu(0.01);
        dsp.current.lms = new LMSFilter(NUM_TAPS, 0.01);
        dsp.current.metric = new MetricCalculator();
        break;
      case 4:
        break;
    }
  }, [narrativeState]);

  // ── Main Simulation Loop (60fps rAF) ─────────────────────────────────────────
  useEffect(() => {
    let animationId: number;

    const loop = () => {
      if (playing) {
        const pd = plotData.current;
        const { sigGen, echoPath, lms, metric } = dsp.current;

        let latestErle = 0;

        for (let i = 0; i < SAMPLES_PER_FRAME; i++) {
          const x = sigGen.getNextSample(250);
          const echo = echoPath.process(x);
          const noise = (Math.random() * 2 - 1) * noiseLevel;
          const d = echo + noise;

          const { estimatedEcho, error: rawError } = lms.process(x, d);
          const e = cancellerOn ? rawError : d;

          latestErle = metric.update(d, e, x);

          pd.x.copyWithin(0, 1);    pd.x[PLOT_SAMPLES - 1] = x;
          pd.d.copyWithin(0, 1);    pd.d[PLOT_SAMPLES - 1] = d;
          pd.yHat.copyWithin(0, 1); pd.yHat[PLOT_SAMPLES - 1] = cancellerOn ? estimatedEcho : 0;
          pd.e.copyWithin(0, 1);    pd.e[PLOT_SAMPLES - 1] = e;

          errorHistory.current.push(Math.abs(e));
          if (errorHistory.current.length > STATUS_WINDOW) errorHistory.current.shift();
        }

        const history = errorHistory.current;
        let newStatus: 'converged' | 'adapting' | 'diverging' | 'idle' = 'idle';
        if (!cancellerOn) {
          newStatus = 'idle';
        } else if (history.length >= STATUS_WINDOW) {
          const firstHalf  = history.slice(0, STATUS_WINDOW / 2).reduce((a, b) => a + b, 0);
          const secondHalf = history.slice(STATUS_WINDOW / 2).reduce((a, b) => a + b, 0);
          const ratio = secondHalf / Math.max(firstHalf, 1e-10);
          if (ratio > 1.3)      newStatus = 'diverging';
          else if (latestErle > 8) newStatus = 'converged';
          else                  newStatus = 'adapting';
        } else {
          newStatus = 'adapting';
        }

        const estimatedWeights = lms.getWeights();
        const norm = computeL2Norm(taps, estimatedWeights);
        const computedMuMax = metric.getMuMax(NUM_TAPS);

        setErle(latestErle);
        setL2norm(isFinite(norm) ? norm : 0);
        setMuMax(isFinite(computedMuMax) ? computedMuMax : 0.05);
        setStatus(newStatus);
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [playing, cancellerOn, noiseLevel, taps]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSetTap = useCallback((index: number, val: number) => {
    setTaps(prev => { const next = [...prev]; next[index] = val; return next; });
  }, []);

  const handleReset = useCallback(() => {
    dsp.current.lms    = new LMSFilter(NUM_TAPS, mu);
    dsp.current.metric = new MetricCalculator();
    setErle(0); setL2norm(0);
    errorHistory.current = [];
    plotData.current.x.fill(0);
    plotData.current.d.fill(0);
    plotData.current.yHat.fill(0);
    plotData.current.e.fill(0);
  }, [mu]);

  const handlePreset = useCallback((presetName: PresetName) => {
    const p = PRESETS[presetName];
    setTaps([...p.taps]);
    setMu(p.mu);
    setNoiseLevel(p.noiseLevel);
    dsp.current.lms    = new LMSFilter(NUM_TAPS, p.mu);
    dsp.current.metric = new MetricCalculator();
    setErle(0); setL2norm(0);
    errorHistory.current = [];
    plotData.current.x.fill(0);
    plotData.current.d.fill(0);
    plotData.current.yHat.fill(0);
    plotData.current.e.fill(0);
  }, []);

  const handleExport = useCallback(async () => {
    const { default: html2canvas } = await import('html2canvas');
    const el = document.getElementById('export-target');
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: '#080812', scale: 2 });
    const link = document.createElement('a');
    link.download = `echo-canceller-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const estimatedWeights = dsp.current.lms.getWeights();

  // ── Status pill config ───────────────────────────────────────────────────────
  const statusConfig = {
    converged: { border: 'border-trace1/40',  text: 'text-trace1',  bg: 'bg-trace1/10',  dot: 'bg-trace1 animate-pulse' },
    adapting:  { border: 'border-accent/40',  text: 'text-accent',  bg: 'bg-accent/10',  dot: 'bg-accent animate-pulse' },
    diverging: { border: 'border-trace3/40',  text: 'text-trace3',  bg: 'bg-trace3/10',  dot: 'bg-trace3 animate-ping'  },
    idle:      { border: 'border-border/30',  text: 'text-muted',   bg: 'bg-border/5',   dot: 'bg-muted'                },
  };
  const pill = statusConfig[status];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ minWidth: '1200px' }}>

      {/* ── TOP HEADER BAR ─────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center justify-between px-6 py-2.5 border-b border-border/20 z-20"
        style={{ background: 'rgb(var(--c-panel) / 0.85)', backdropFilter: 'blur(20px)' }}
      >
        {/* Left: title */}
        <div className="flex flex-col">
          <span className="text-primary font-bold text-sm tracking-tight leading-tight">
            Digital Echo Cancellation
          </span>
          <span className="text-muted text-[10px] font-mono mt-0.5">
            Applied Mathematics Capstone · Z-Transform &amp; LMS Adaptive Filtering
          </span>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-4">
          <span className="text-muted text-[10px] font-mono hidden lg:block opacity-60">
            Janani · DSP Lab 2024
          </span>

          {/* Theme Toggle — premium pill button */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/30 font-mono text-[11px] font-semibold transition-all hover:border-accent/50 hover:shadow-neon-accent group"
            style={{ background: 'rgb(var(--c-panel-solid) / 0.8)' }}
          >
            <span className={`transition-all duration-300 ${theme === 'dark' ? 'text-accent' : 'text-muted group-hover:text-accent'}`}>
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </span>
            <span className="text-muted group-hover:text-primary transition-colors">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>

          {/* Live status pill */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border font-mono text-[10px] font-bold uppercase transition-all duration-500 ${pill.border} ${pill.text} ${pill.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
            {status.toUpperCase()}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT RAIL ──────────────────────────────────────────────────────── */}
        <ControlRail
          mu={mu} setMu={setMu} muMax={muMax}
          noiseLevel={noiseLevel} setNoiseLevel={setNoiseLevel}
          cancellerOn={cancellerOn} setCancellerOn={setCancellerOn}
          playing={playing} setPlaying={setPlaying}
          narrativeState={narrativeState} setNarrativeState={setNarrativeState}
          reset={handleReset}
          taps={taps} setTap={handleSetTap}
          onPreset={handlePreset}
          onExport={handleExport}
        />

        {/* ── RIGHT CONTENT — true single-page, no scroll ────────────────────── */}
        <div
          id="export-target"
          className="flex-1 flex flex-col overflow-hidden gap-0 p-4"
        >

          {/* ── HERO METRICS ROW ────────────────────────────────────────────── */}
          <div className="shrink-0 h-[120px] mb-3">
            <HeroMetric
              erle={cancellerOn ? erle : 0}
              l2norm={cancellerOn ? l2norm : computeL2Norm(taps, new Array(NUM_TAPS).fill(0))}
              status={cancellerOn ? status : 'idle'}
            />
          </div>

          {/* ── PLOTS GRID — 2 rows × 3 cols, fills remaining space ────────── */}
          <div className="grid grid-cols-3 grid-rows-2 gap-3 flex-1 min-h-0">

            <OscilloscopePlot
              title="x[n] vs d[n]   Near-end vs Mic"
              dataSets={[
                { data: plotData.current.d,    color: '#f472b6', label: 'Mic d[n]' },
                { data: plotData.current.x,    color: '#34d399', label: 'Ref x[n]' },
              ]}
            />

            <OscilloscopePlot
              title="ŷ[n] vs d[n]   Echo Estimate vs Mic"
              dataSets={[
                { data: plotData.current.d,    color: '#f472b6', label: 'Mic d[n]' },
                { data: plotData.current.yHat, color: '#c084fc', label: 'Est ŷ[n]' },
              ]}
            />

            <OscilloscopePlot
              title="e[n]   Residual Error"
              yMin={-1} yMax={1}
              dataSets={[
                { data: plotData.current.e, color: '#fb7185', label: 'Error e[n]' },
              ]}
            />

            <TapWeightsPlot
              trueTaps={taps}
              estimatedTaps={estimatedWeights}
            />

            <MagnitudeResponse
              trueTaps={taps}
              estimatedTaps={estimatedWeights}
            />

            <PoleZeroPlot
              trueTaps={taps}
              estimatedTaps={estimatedWeights}
            />

          </div>

          {/* ── SYSTEM EQUATIONS — compact strip ───────────────────────────── */}
          <div className="shrink-0 mt-3">
            <SystemEquations
              mu={mu}
              muMax={muMax}
              numTaps={NUM_TAPS}
              erle={cancellerOn ? erle : 0}
              l2norm={cancellerOn ? l2norm : 0}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Root export: wraps EchoApp in ThemeProvider ─────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <EchoApp />
    </ThemeProvider>
  );
}
