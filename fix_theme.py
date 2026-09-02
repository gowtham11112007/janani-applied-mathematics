import re

with open('src/context/ThemeContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("?? 'dark'", "?? 'light'")
content = content.replace("theme: 'dark'", "theme: 'light'")

with open('src/context/ThemeContext.tsx', 'w') as f:
    f.write(content)

with open('src/index.css', 'r') as f:
    css_content = f.read()

# Make the light theme more professional (neutral grays instead of lavenders)
css_content = css_content.replace("--c-bg:           248 247 255;", "--c-bg:           240 242 245;") # Tailwind gray-100
css_content = css_content.replace("--c-panel-solid:  251 250 255;", "--c-panel-solid:  248 250 252;")
css_content = css_content.replace("--c-border:       199 210 254;", "--c-border:       203 213 225;") # Tailwind slate-300
css_content = css_content.replace("--c-accent:       99 102 241;", "--c-accent:       37 99 235;")   # Tailwind blue-600

# Remove the purple radial gradients from light theme body background to keep it completely flat and professional
css_content = re.sub(
    r'html\[data-theme="light"\]\s*\{\s*background-image:[^}]*\}',
    'html[data-theme="light"] { background-image: none; }',
    css_content,
    flags=re.DOTALL
)

with open('src/index.css', 'w') as f:
    f.write(css_content)

