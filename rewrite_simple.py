import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the 3x2 grid with a simpler 2x2 grid
# Grid container:
# <div className="grid grid-cols-3 grid-rows-2 gap-3 flex-1 min-h-0">
grid_start = content.find('<div className="grid grid-cols-3 grid-rows-2 gap-3 flex-1 min-h-0">')
grid_end = content.find('<div className="shrink-0 mt-3">', grid_start)

new_grid = """
          <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1 min-h-0">
            <OscilloscopePlot
              title="1. Original x[n] vs Received y[n]"
              dataSets={[
                { data: plotData.current.d, color: '#f472b6', label: 'Received y[n]' },
                { data: plotData.current.x, color: '#34d399', label: 'Original x[n]' },
              ]}
            />
            <OscilloscopePlot
              title="2. Estimated Echo ê[n] vs Received y[n]"
              dataSets={[
                { data: plotData.current.d,    color: '#f472b6', label: 'Received y[n]' },
                { data: plotData.current.yHat, color: '#c084fc', label: 'Est Echo ê[n] + x[n]' },
              ]}
            />
            <TapWeightsPlot 
              title="3. Adaptive Filter (Finding Delay N & α)"
              trueTaps={(() => {
                const arr = Array(40).fill(0);
                if (trueDelay < 40) arr[trueDelay] = trueAlpha;
                return arr;
              })()}
              estimatedTaps={Array.from(dsp.current.adaptive.weights).slice(0, 40)}
            />
            <OscilloscopePlot
              title="4. Cleaned Signal (Error e[n])"
              yMin={-1.5} yMax={1.5}
              dataSets={[
                { data: plotData.current.e, color: '#fb7185', label: 'Cleaned e[n] ≈ x[n]' },
              ]}
            />
          </div>
"""

content = content[:grid_start] + new_grid.strip() + "\n          " + content[grid_end:]

# We also don't need MagnitudeResponse, ImpulseResponsePlot, PoleZeroPlot imports
content = re.sub(r"import \{ (ImpulseResponsePlot|MagnitudeResponse|PoleZeroPlot) \}.*?\n", "", content)

# Update App state so Adaptive Mode is ALWAYS ON, removing the complexity of manual mode
content = content.replace("const [adaptiveMode, setAdaptiveMode] = useState(false);", "const [adaptiveMode, setAdaptiveMode] = useState(true);")

with open('src/App.tsx', 'w') as f:
    f.write(content)

