import re

with open('src/components/ControlRail.tsx', 'r') as f:
    content = f.read()

# Replace labels to match PPT
content = content.replace('label="Delay D (Samples)"', 'label="Echo Delay (N)"')
content = content.replace('label="Attenuation α"', 'label="Echo Attenuation (α)"')

# Make the estimated values read-only
# We will replace the Faders for estDelay and estAlpha with simple text displays.
est_section = """
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
"""

content = re.sub(r"<Fader\s+label=\"Est\. Delay D̂\".*?accentClass=\"accent-trace4\"\s+/>", "", content, flags=re.DOTALL)
content = re.sub(r"<Fader\s+label=\"Est\. Attenuation α̂\".*?accentClass=\"accent-trace4\"\s+/>", est_section.strip(), content, flags=re.DOTALL)

with open('src/components/ControlRail.tsx', 'w') as f:
    f.write(content)
