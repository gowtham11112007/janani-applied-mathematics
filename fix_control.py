import re

with open('src/components/ControlRail.tsx', 'r') as f:
    content = f.read()

content = content.replace("  setEstDelay: (val: number) => void;\n", "")
content = content.replace("  setEstAlpha: (val: number) => void;\n", "")

content = content.replace("  estDelay, setEstDelay,\n", "  estDelay,\n")
content = content.replace("  estAlpha, setEstAlpha,\n", "  estAlpha,\n")

with open('src/components/ControlRail.tsx', 'w') as f:
    f.write(content)
