import re

with open('src/components/ControlRail.tsx', 'r') as f:
    content = f.read()

# Add adaptiveMode props
content = content.replace("cancellerOn: boolean;\n  setCancellerOn: (val: boolean) => void;",
                          "cancellerOn: boolean;\n  setCancellerOn: (val: boolean) => void;\n  adaptiveMode: boolean;\n  setAdaptiveMode: (val: boolean) => void;")

content = content.replace("cancellerOn, setCancellerOn,",
                          "cancellerOn, setCancellerOn,\n  adaptiveMode, setAdaptiveMode,")

# Replace matchPerfectly with toggleAdaptive
content = re.sub(r"const matchPerfectly = \(\) => \{.*?\};", "", content, flags=re.DOTALL)

button_html = """
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
"""

content = re.sub(r"<button\s+onClick=\{matchPerfectly\}.*?Auto-Estimate Parameters\s+</button>", button_html.strip(), content, flags=re.DOTALL)

# Disable faders if adaptiveMode is on
content = content.replace("onChange={setEstDelay}", "onChange={(v) => !adaptiveMode && setEstDelay(v)}")
content = content.replace("onChange={setEstAlpha}", "onChange={(v) => !adaptiveMode && setEstAlpha(v)}")

with open('src/components/ControlRail.tsx', 'w') as f:
    f.write(content)
