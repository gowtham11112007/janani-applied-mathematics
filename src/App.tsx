import { useState, useEffect, useRef, useCallback } from 'react';
import { ControlRail } from './components/ControlRail';
import { OscilloscopePlot } from './components/OscilloscopePlot';
import { ImpulseResponsePlot } from './components/ImpulseResponsePlot';
import { MagnitudeResponse } from './components/MagnitudeResponse';
import { PoleZeroPlot } from './components/PoleZeroPlot';
import { HeroMetric } from './components/HeroMetric';
import { SystemEquations } from './components/SystemEquations';
import { SignalGenerator, DelayLine, MetricCalculator } from './dsp/EchoCanceller';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const PLOT_SAMPLES = 512;
const SAMPLES_PER_FRAME = 4;

function EchoApp() {
  const { theme, toggle: toggleTheme } = useTheme();

  // ── UI State ────────────────────────────────────────────────────────────────
  const [playing, setPlaying]         = useState(true);
  const [cancellerOn, setCancellerOn] = useState(true);
  
  const [trueDelay, setTrueDelay]     = useState(15);
  const [trueAlpha, setTrueAlpha]     = useState(0.6);
  
  const [estDelay, setEstDelay]       = useState(0);
  const [estAlpha, setEstAlpha]       = useState(0.0);

  // ── Computed Metrics ─────────────────────────────────────────────────────────
  const [erle, setErle] = useState(0);

  // ── Plot buffers ─────────────────────────────────────────────────────────────
  const plotData = useRef({
    x:    new Float32Array(PLOT_SAMPLES),
    d:    new Float32Array(PLOT_SAMPLES),
    yHat: new Float32Array(PLOT_SAMPLES),
    e:    new Float32Array(PLOT_SAMPLES),
  });

  // ── DSP instances ────────────────────────────────────────────────────────────
  const dsp = useRef({
    sigGen:     new SignalGenerator(),
    roomDelay:  new DelayLine(100),
    estDelay:   new DelayLine(100),
    metric:     new MetricCalculator(),
  });

  // ── Main Simulation Loop ─────────────────────────────────────────────────────
  useEffect(() => {
    let animationId: number;

    const loop = () => {
      if (playing) {
        const pd = plotData.current;
        const { sigGen, roomDelay, estDelay: estDelayLine, metric } = dsp.current;

        let latestErle = 0;

        for (let i = 0; i < SAMPLES_PER_FRAME; i++) {
          const x = sigGen.getNextSample(250);
          
          // Actual Room Echo
          const roomEcho = roomDelay.process(x, trueDelay, trueAlpha);
          const noise = (Math.random() * 2 - 1) * 0.02; // very slight noise
          const d = x + roomEcho + noise;

          // Estimated Echo (Canceller)
          const estimatedEcho = cancellerOn ? estDelayLine.process(x, estDelay, estAlpha) : 0;
          
          // Note: Estimated echo signal uses its own delay line, but since they process the same 'x', 
          // we must ensure they stay synchronized or just compute it cleanly. 
          // Actually, our DelayLine writes 'x' every step. It's safe!
          
          const e = d - estimatedEcho;

          // ERLE measures the ratio of echo power to residual echo power.
          // Since our 'd' contains 'x', we must subtract 'x' to measure purely the echo reduction.
          const trueEchoOnly = d - x;
          const residualEchoOnly = e - x;
          latestErle = metric.update(trueEchoOnly, residualEchoOnly);

          pd.x.copyWithin(0, 1);    pd.x[PLOT_SAMPLES - 1] = x;
          pd.d.copyWithin(0, 1);    pd.d[PLOT_SAMPLES - 1] = d;
          pd.yHat.copyWithin(0, 1); pd.yHat[PLOT_SAMPLES - 1] = x + estimatedEcho; 
          pd.e.copyWithin(0, 1);    pd.e[PLOT_SAMPLES - 1] = e;
        }

        setErle(cancellerOn ? latestErle : 0);
      }
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [playing, cancellerOn, trueDelay, trueAlpha, estDelay, estAlpha]);

  const handleReset = useCallback(() => {
    dsp.current.roomDelay = new DelayLine(100);
    dsp.current.estDelay = new DelayLine(100);
    dsp.current.metric = new MetricCalculator();
    setErle(0);
    plotData.current.x.fill(0);
    plotData.current.d.fill(0);
    plotData.current.yHat.fill(0);
    plotData.current.e.fill(0);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ minWidth: '1200px' }}>
      <header
        className="shrink-0 flex items-center justify-between px-6 py-2.5 border-b border-border/20 z-20"
        style={{ background: 'rgb(var(--c-panel) / 0.85)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex flex-col">
          <span className="text-primary font-bold text-sm tracking-tight leading-tight">
            Design of a Digital Echo Cancellation System
          </span>
          <span className="text-muted text-[10px] font-mono mt-0.5">
            Using Z-Transforms — UBA0614 Applied Mathematics Capstone
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-muted text-[10px] font-mono hidden lg:block opacity-60">
            Janani Sri R & Lakshmi Shruthika
          </span>
          <button
            onClick={toggleTheme}
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
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ControlRail
          trueDelay={trueDelay} setTrueDelay={setTrueDelay}
          trueAlpha={trueAlpha} setTrueAlpha={setTrueAlpha}
          estDelay={estDelay} setEstDelay={setEstDelay}
          estAlpha={estAlpha} setEstAlpha={setEstAlpha}
          cancellerOn={cancellerOn} setCancellerOn={setCancellerOn}
          playing={playing} setPlaying={setPlaying}
          reset={handleReset}
        />

        <div className="flex-1 flex flex-col overflow-hidden gap-0 p-4">
          <div className="shrink-0 h-[120px] mb-3">
            <HeroMetric
              erle={erle}
              alphaErr={Math.abs(trueAlpha - estAlpha)}
              delayErr={Math.abs(trueDelay - estDelay)}
              cancellerOn={cancellerOn}
            />
          </div>

          <div className="grid grid-cols-3 grid-rows-2 gap-3 flex-1 min-h-0">
            <OscilloscopePlot
              title="x[n] vs d[n]   Near-end vs Mic"
              dataSets={[
                { data: plotData.current.d, color: '#f472b6', label: 'Mic d[n]' },
                { data: plotData.current.x, color: '#34d399', label: 'Near-end x[n]' },
              ]}
            />
            <OscilloscopePlot
              title="y_hat[n] vs d[n]   Estimated vs Mic"
              dataSets={[
                { data: plotData.current.d,    color: '#f472b6', label: 'Mic d[n]' },
                { data: plotData.current.yHat, color: '#c084fc', label: 'Est Echo + x[n]' },
              ]}
            />
            <OscilloscopePlot
              title="e[n]   Transmitted (Error) Signal"
              yMin={-1.5} yMax={1.5}
              dataSets={[
                { data: plotData.current.e, color: '#fb7185', label: 'Transmitted e[n]' },
              ]}
            />
            
            <ImpulseResponsePlot
              trueAlpha={trueAlpha} trueDelay={trueDelay}
              estAlpha={cancellerOn ? estAlpha : 0} estDelay={estDelay}
            />
            <MagnitudeResponse
              trueAlpha={trueAlpha} trueDelay={trueDelay}
              estAlpha={cancellerOn ? estAlpha : 0} estDelay={estDelay}
            />
            <PoleZeroPlot
              trueAlpha={trueAlpha} trueDelay={trueDelay}
              estAlpha={cancellerOn ? estAlpha : 0} estDelay={estDelay}
            />
          </div>

          <div className="shrink-0 mt-3">
            <SystemEquations
              trueAlpha={trueAlpha} trueDelay={trueDelay}
              estAlpha={cancellerOn ? estAlpha : 0} estDelay={estDelay}
              erle={erle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <EchoApp />
    </ThemeProvider>
  );
}
