import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

plot_logic_old = """
            {adaptiveMode ? (
              <TapWeightsPlot weights={dsp.current.adaptive.weights} />
            ) : (
"""

plot_logic_new = """
            {adaptiveMode ? (
              <TapWeightsPlot 
                trueTaps={(() => {
                  const arr = Array(40).fill(0);
                  if (trueDelay < 40) arr[trueDelay] = trueAlpha;
                  return arr;
                })()}
                estimatedTaps={Array.from(dsp.current.adaptive.weights).slice(0, 40)}
              />
            ) : (
"""

content = content.replace(plot_logic_old.strip(), plot_logic_new.strip())

with open('src/App.tsx', 'w') as f:
    f.write(content)
