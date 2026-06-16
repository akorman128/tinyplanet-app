export interface AccelSample {
  x: number;
  y: number;
  z: number;
}

export interface ShakeDetectorConfig {
  threshold?: number; // magnitude (g) that counts as a jolt; rest ≈ 1
  requiredJolts?: number; // jolts needed within the window to fire
  windowMs?: number; // sliding window length
}

export class ShakeDetector {
  private readonly threshold: number;
  private readonly requiredJolts: number;
  private readonly windowMs: number;
  private joltTimes: number[] = [];
  private wasAboveThreshold = false;

  constructor(config: ShakeDetectorConfig = {}) {
    this.threshold = config.threshold ?? 1.8;
    this.requiredJolts = config.requiredJolts ?? 3;
    this.windowMs = config.windowMs ?? 1000;
  }

  /** Returns true exactly once when a shake is detected, then resets. */
  process(sample: AccelSample, now: number): boolean {
    const magnitude = Math.sqrt(
      sample.x * sample.x + sample.y * sample.y + sample.z * sample.z
    );
    const above = magnitude > this.threshold;

    // Count a jolt only on the rising edge so a sustained spike is one jolt.
    if (above && !this.wasAboveThreshold) {
      this.joltTimes.push(now);
    }
    this.wasAboveThreshold = above;

    // Keep only jolts inside the sliding window.
    this.joltTimes = this.joltTimes.filter((t) => now - t <= this.windowMs);

    if (this.joltTimes.length >= this.requiredJolts) {
      this.reset();
      return true;
    }
    return false;
  }

  reset(): void {
    this.joltTimes = [];
    this.wasAboveThreshold = false;
  }
}
