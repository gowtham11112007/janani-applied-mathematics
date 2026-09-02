with open('src/components/SystemEquations.tsx', 'r') as f:
    content = f.read()

content = content.replace('math="H(z) = 1 + \\alpha z^{-D}"', 'math="H(z) = 1 + \\alpha z^{-N}"')
content = content.replace('math="\\hat{y}[n] = \\hat{\\alpha} \\cdot x[n - \\hat{D}]"', 'math="\\hat{e}[n] = \\hat{\\alpha} x[n - \\hat{N}]"')
content = content.replace('math="E(z) = D(z) - \\hat{Y}(z)"', 'math="e[n] = y[n] - \\hat{e}[n]"')
content = content.replace('label="ΔD"', 'label="ΔN"')
content = content.replace('label="Room Z-Transform"', 'label="Echo Z-Transform"')
content = content.replace('label="Canceller Model"', 'label="Echo Estimation"')

with open('src/components/SystemEquations.tsx', 'w') as f:
    f.write(content)

