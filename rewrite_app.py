import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import for AdaptiveFilter
content = content.replace("import { SignalGenerator, DelayLine, MetricCalculator } from './dsp/EchoCanceller';",
                          "import { SignalGenerator, DelayLine, MetricCalculator, AdaptiveFilter } from './dsp/EchoCanceller';\nimport { TapWeightsPlot } from './components/TapWeightsPlot';")

# Add adaptive filter to dsp refs
content = content.replace("estDelay:   new DelayLine(100),",
                          "estDelay:   new DelayLine(100),\n    adaptive:   new AdaptiveFilter(50, 0.05),")

# Add adaptiveMode state
content = content.replace("const [cancellerOn, setCancellerOn] = useState(true);",
                          "const [cancellerOn, setCancellerOn] = useState(true);\n  const [adaptiveMode, setAdaptiveMode] = useState(false);")

# Update ControlRail props in JSX
content = content.replace("cancellerOn={cancellerOn} setCancellerOn={setCancellerOn}",
                          "cancellerOn={cancellerOn} setCancellerOn={setCancellerOn}\n          adaptiveMode={adaptiveMode} setAdaptiveMode={setAdaptiveMode}")

# Inside useEffect, process adaptive filter
loop_processing = """
          // Estimated Echo (Canceller)
          let estimatedEcho = 0;
          if (cancellerOn) {
            if (adaptiveMode) {
              const res = dsp.current.adaptive.process(x, d);
              estimatedEcho = res.estimatedEcho;
            } else {
              estimatedEcho = estDelayLine.process(x, estDelay, estAlpha);
            }
          }
          
          const e = d - estimatedEcho;
"""
content = re.sub(r"// Estimated Echo \(Canceller\).*?const e = d - estimatedEcho;", loop_processing.strip(), content, flags=re.DOTALL)

# Add throttling for adaptive parameter updates to UI
ui_updates = """
        setErle(cancellerOn ? latestErle : 0);
        if (adaptiveMode && cancellerOn && Math.random() < 0.05) { // update UI occasionally
          const { estDelay: ad, estAlpha: aa } = dsp.current.adaptive.getEstimatedDelayAndAlpha();
          setEstDelay(ad);
          setEstAlpha(aa);
        }
"""
content = content.replace("setErle(cancellerOn ? latestErle : 0);", ui_updates.strip())

# Add Adaptive Filter Reset
reset_logic = """
    dsp.current.roomDelay = new DelayLine(100);
    dsp.current.estDelay = new DelayLine(100);
    dsp.current.adaptive = new AdaptiveFilter(50, 0.05);
"""
content = re.sub(r"dsp\.current\.roomDelay = new DelayLine\(100\);\s*dsp\.current\.estDelay = new DelayLine\(100\);", reset_logic.strip(), content)

# Change dependency array to include adaptiveMode
content = content.replace("estDelay, estAlpha]);", "estDelay, estAlpha, adaptiveMode]);")

# Replace PoleZeroPlot with TapWeightsPlot when in adaptive mode, or just add TapWeightsPlot
# We'll put TapWeightsPlot in place of PoleZeroPlot if adaptiveMode is true
plot_logic = """
            {adaptiveMode ? (
              <TapWeightsPlot weights={dsp.current.adaptive.weights} />
            ) : (
              <PoleZeroPlot
                trueAlpha={trueAlpha} trueDelay={trueDelay}
                estAlpha={cancellerOn ? estAlpha : 0} estDelay={estDelay}
              />
            )}
"""
content = re.sub(r"<PoleZeroPlot\s+trueAlpha=\{trueAlpha\}.*?/>", plot_logic.strip(), content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
