import re

def add_hint_prop(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Add hint?: string; to props interface
    content = re.sub(r'title\??:\s*string;', r'title: string;\n  hint?: string;', content)
    
    # Add hint to destructuring
    content = re.sub(r'title(\s*\=.*?)?\n\}\)', r'title\1,\n  hint\n})', content)

    # Add code to render the hint in canvas
    render_hint_code = """
      // Hint
      if (hint) {
        ctx.fillStyle = cssVar('--c-canvas-legend');
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText(hint, 10, 36);
      }
"""
    content = content.replace("ctx.fillText(title, 10, 18);", "ctx.fillText(title, 10, 18);\n" + render_hint_code)

    with open(filename, 'w') as f:
        f.write(content)

add_hint_prop('src/components/OscilloscopePlot.tsx')
add_hint_prop('src/components/TapWeightsPlot.tsx')

