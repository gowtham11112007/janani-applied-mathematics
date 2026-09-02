with open('src/components/HeroMetric.tsx', 'r') as f:
    content = f.read()

content = content.replace('>Δ Delay<', '>Δ N<')
content = content.replace('>Δ Atten<', '>Δ α<')

with open('src/components/HeroMetric.tsx', 'w') as f:
    f.write(content)
