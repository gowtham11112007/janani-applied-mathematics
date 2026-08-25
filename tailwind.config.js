/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background:  'rgb(var(--c-bg) / <alpha-value>)',
        panel:       'rgb(var(--c-panel) / <alpha-value>)',
        panelSolid:  'rgb(var(--c-panel-solid) / <alpha-value>)',
        border:      'rgb(var(--c-border) / <alpha-value>)',
        primary:     'rgb(var(--c-primary) / <alpha-value>)',
        muted:       'rgb(var(--c-muted) / <alpha-value>)',
        accent:      'rgb(var(--c-accent) / <alpha-value>)',
        trace1: 'rgb(52 211 153 / <alpha-value>)',   /* emerald   */
        trace2: 'rgb(244 114 182 / <alpha-value>)',  /* pink      */
        trace3: 'rgb(251 113 133 / <alpha-value>)',  /* rose      */
        trace4: 'rgb(192 132 252 / <alpha-value>)',  /* violet    */
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass':       'var(--c-shadow-glass)',
        'neon-accent': 'var(--glow-accent)',
        'neon-cyan':   'var(--glow-cyan)',
        'neon-teal':   '0 0 15px rgba(167, 139, 250, 0.5)',
      },
    },
  },
  plugins: [],
}
