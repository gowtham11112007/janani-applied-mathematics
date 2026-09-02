with open('src/dsp/EchoCanceller.ts', 'r') as f:
    content = f.read()

# In AdaptiveFilter.process, force weight[0] to be 0 so it doesn't cancel the original signal
force_weight_0 = """
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] += stepSize * error * this.xBuffer[i];
    }
    this.weights[0] = 0; // CRITICAL: Prevent cancelling the original signal x[n]
"""

content = content.replace("""    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] += stepSize * error * this.xBuffer[i];
    }""", force_weight_0.strip())

with open('src/dsp/EchoCanceller.ts', 'w') as f:
    f.write(content)

