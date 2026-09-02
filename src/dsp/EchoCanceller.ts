export class SignalGenerator {
  private phase = 0;
  
  // Generates a speech-like / pulse-like signal
  getNextSample(frequency = 250): number {
    this.phase += (Math.PI * 2 * frequency) / 8000;
    if (this.phase > Math.PI * 2) this.phase -= Math.PI * 2;
    
    // Mix of sine waves + envelope to make it look like bursts/pulses
    const raw = Math.sin(this.phase) + 0.5 * Math.sin(this.phase * 2.3);
    
    // Add burst envelope so we can easily see the delay
    const envelope = Math.max(0, Math.sin(this.phase * 0.1)) ** 4;
    return raw * envelope;
  }
}

export class DelayLine {
  private buffer: Float32Array;
  private ptr: number = 0;

  constructor(maxDelay: number) {
    this.buffer = new Float32Array(maxDelay);
  }

  process(input: number, delay: number, attenuation: number): number {
    // Read from the delay buffer
    const outIndex = (this.ptr - Math.floor(delay) + this.buffer.length) % this.buffer.length;
    const delayedSample = this.buffer[outIndex];
    
    // Write current input
    this.buffer[this.ptr] = input;
    this.ptr = (this.ptr + 1) % this.buffer.length;
    
    return delayedSample * attenuation;
  }
}

// Computes ERLE based on powers
export class MetricCalculator {
  private dPower = 0.001;
  private ePower = 0.001;
  private smoothing = 0.99;

  update(d: number, e: number): number {
    this.dPower = this.smoothing * this.dPower + (1 - this.smoothing) * (d * d);
    this.ePower = this.smoothing * this.ePower + (1 - this.smoothing) * (e * e);
    
    const erle = 10 * Math.log10(this.dPower / this.ePower);
    return Math.max(0, erle);
  }
}
