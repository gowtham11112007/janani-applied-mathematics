with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("label: 'Est Echo ê[n] + x[n]'", "label: 'Est Echo ê[n]'")

with open('src/App.tsx', 'w') as f:
    f.write(content)
