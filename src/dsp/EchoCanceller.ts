/**
 * =============================================================================
 * DSP Core: Digital Echo Canceller
 * Applied Mathematics Capstone — Z-Transform Echo Cancellation
 * =============================================================================
 *
 * This module implements the core DSP math for the adaptive echo canceller.
 * The system model is:
 *
 *   Room echo path:   H(z) = Σ h_k · z^{-k}    (FIR filter)
 *   Mic signal:       d[n] = (x * h)[n] + v[n]  (echo + noise)
 *   LMS weight update:ŵ[n+1] = ŵ[n] + μ·e[n]·x[n]  (gradient descent)
 *   Error:            e[n] = d[n] - ŷ[n]
 *   ERLE:             10·log10( E[d²] / E[e²] )  in dB
 */

// ─── Signal Generator ──────────────────────────────────────────────────────────

export class SignalGenerator {
  private phase = 0;
  private readonly sampleRate = 8000; // 8 kHz voice-band sample rate

  /**
   * Produces a synthetic speech-like signal:
   *   x[n] = (sin(2πf₀t) + 0.5·sin(2π·2.1f₀t) + 0.25·sin(2π·3.3f₀t)) · A(t)
   * where A(t) = 0.5 + 0.5·sin(2π·2t) is a 2 Hz speech-burst envelope.
   */
  public getNextSample(freq: number = 300): number {
    const t = this.phase / this.sampleRate;
    const sig1 = Math.sin(2 * Math.PI * freq * t);
    const sig2 = 0.5 * Math.sin(2 * Math.PI * (freq * 2.1) * t);
    const sig3 = 0.25 * Math.sin(2 * Math.PI * (freq * 3.3) * t);
    const env = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2 * t);
    this.phase++;
    return (sig1 + sig2 + sig3) * env * 0.5;
  }

  public reset(): void {
    this.phase = 0;
  }
}

// ─── Echo Path (True Room Impulse Response) ────────────────────────────────────

export class EchoPath {
  private taps: number[];
  private buffer: number[];

  constructor(initialTaps: number[]) {
    this.taps = [...initialTaps];
    this.buffer = new Array(initialTaps.length).fill(0);
  }

  public setTaps(newTaps: number[]): void {
    this.taps = [...newTaps];
    if (this.buffer.length !== newTaps.length) {
      this.buffer = new Array(newTaps.length).fill(0);
    }
  }

  /**
   * Z-Domain FIR filter:  H(z) = Σ h_k · z^{-k}
   *
   * In time domain: y[n] = Σ_{k=0}^{N-1} h_k · x[n-k]
   */
  public process(input: number): number {
    // Shift buffer: x[n-k] = x[n-k+1] pushed back
    for (let i = this.buffer.length - 1; i > 0; i--) {
      this.buffer[i] = this.buffer[i - 1];
    }
    this.buffer[0] = input;

    let output = 0;
    for (let k = 0; k < this.taps.length; k++) {
      output += this.taps[k] * this.buffer[k]; // h_k · x[n-k]
    }
    return output;
  }

  public getTaps(): number[] {
    return [...this.taps];
  }
}

// ─── LMS Adaptive Filter ────────────────────────────────────────────────────────

export class LMSFilter {
  public weights: number[];  // ŵ[n] — estimated echo path
  private buffer: number[];  // x[n], x[n-1], ..., x[n-N+1]
  public mu: number;         // Step size μ (learning rate)

  constructor(numTaps: number, initialMu: number = 0.01) {
    this.weights = new Array(numTaps).fill(0);
    this.buffer = new Array(numTaps).fill(0);
    this.mu = initialMu;
  }

  public getWeights(): number[] {
    return [...this.weights];
  }

  /**
   * LMS Adaptive Filter — one sample update
   *
   * Step 1 — Estimate echo (inner product of weight vector and input buffer):
   *   ŷ[n] = ŵᵀ[n] · x̃[n]  where x̃[n] = [x[n], x[n-1], ..., x[n-N+1]]ᵀ
   *
   * Step 2 — Error signal:
   *   e[n] = d[n] − ŷ[n]
   *
   * Step 3 — Steepest-descent weight update (LMS rule):
   *   ŵ[n+1] = ŵ[n] + μ · e[n] · x̃[n]
   *
   * Stability condition (derived from gradient descent convergence):
   *   0 < μ < 2 / (N · E[x²])    where E[x²] is signal power
   */
  public process(
    referenceSample: number,
    micSample: number
  ): { estimatedEcho: number; error: number } {
    // Shift input buffer
    for (let i = this.buffer.length - 1; i > 0; i--) {
      this.buffer[i] = this.buffer[i - 1];
    }
    this.buffer[0] = referenceSample; // x[n]

    // Step 1: ŷ[n] = ŵᵀ · x̃
    let estimatedEcho = 0;
    for (let k = 0; k < this.weights.length; k++) {
      estimatedEcho += this.weights[k] * this.buffer[k];
    }

    // Guard against NaN/Inf blow-up during divergence
    if (!isFinite(estimatedEcho)) {
      estimatedEcho = 0;
      this.weights.fill(0); // Hard reset on divergence
    }

    // Step 2: e[n] = d[n] − ŷ[n]
    const error = micSample - estimatedEcho;

    // Step 3: ŵ[n+1] = ŵ[n] + μ·e[n]·x̃[n]
    for (let k = 0; k < this.weights.length; k++) {
      const update = this.mu * error * this.buffer[k];
      // Guard each individual weight against NaN
      if (isFinite(update)) {
        this.weights[k] += update;
      }
    }

    return { estimatedEcho, error };
  }
}

// ─── Metric Calculator ─────────────────────────────────────────────────────────

/**
 * Computes Echo Return Loss Enhancement (ERLE):
 *   ERLE = 10 · log₁₀( E[d²] / E[e²] )   [dB]
 *
 * Uses an exponential moving average (EMA) for power estimation:
 *   P[n] = (1−α)·P[n-1] + α·s²[n]
 */
export class MetricCalculator {
  private dPower = 1e-10;
  private ePower = 1e-10;
  private xPower = 1e-10;  // Running estimate of signal power (for μ_max)
  private readonly alpha = 0.05; // EMA smoothing factor

  /**
   * Update metric with latest mic sample d and error e.
   * Returns { erle, l2norm (not computed here) }.
   */
  public update(d: number, e: number, x: number): number {
    this.dPower = (1 - this.alpha) * this.dPower + this.alpha * d * d;
    this.ePower = (1 - this.alpha) * this.ePower + this.alpha * e * e;
    this.xPower = (1 - this.alpha) * this.xPower + this.alpha * x * x;

    const safeEPower = Math.max(this.ePower, 1e-10);
    const safeDPower = Math.max(this.dPower, 1e-10);

    const erle = 10 * Math.log10(safeDPower / safeEPower);
    return Math.max(0, Math.min(100, erle));
  }

  /**
   * Returns the theoretical maximum stable step size:
   *   μ_max = 2 / (N · E[x²])
   */
  public getMuMax(numTaps: number): number {
    return 2 / (numTaps * Math.max(this.xPower, 1e-6));
  }

  public getXPower(): number {
    return this.xPower;
  }
}

// ─── Utility: L2 Norm of Filter Error ─────────────────────────────────────────

/**
 * Computes the L2 norm of filter estimation error:
 *   ||h − ŵ||₂ = sqrt( Σ (h_k − ŵ_k)² )
 */
export function computeL2Norm(trueTaps: number[], estimatedTaps: number[]): number {
  let sum = 0;
  for (let k = 0; k < trueTaps.length; k++) {
    const diff = (trueTaps[k] || 0) - (estimatedTaps[k] || 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
