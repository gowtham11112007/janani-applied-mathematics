with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("estDelay={estDelay} setEstDelay={setEstDelay}", "estDelay={estDelay}")
content = content.replace("estAlpha={estAlpha} setEstAlpha={setEstAlpha}", "estAlpha={estAlpha}")

with open('src/App.tsx', 'w') as f:
    f.write(content)
