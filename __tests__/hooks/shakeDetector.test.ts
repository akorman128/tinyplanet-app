import { describe, it, expect } from "vitest";
import { ShakeDetector } from "@/hooks/shakeDetector";

const REST = { x: 0, y: 0, z: 1 }; // magnitude 1 (gravity)
const JOLT = { x: 3, y: 0, z: 0 }; // magnitude 3 (> threshold)

describe("ShakeDetector", () => {
  it("fires after the required jolts within the window", () => {
    const d = new ShakeDetector({
      threshold: 1.8,
      requiredJolts: 3,
      windowMs: 1000,
    });
    expect(d.process(REST, 0)).toBe(false);
    expect(d.process(JOLT, 100)).toBe(false); // jolt 1 (rising edge)
    expect(d.process(REST, 150)).toBe(false);
    expect(d.process(JOLT, 300)).toBe(false); // jolt 2
    expect(d.process(REST, 350)).toBe(false);
    expect(d.process(JOLT, 500)).toBe(true); // jolt 3 → fire
  });

  it("does not fire on a single sustained spike", () => {
    const d = new ShakeDetector({ requiredJolts: 3, windowMs: 1000 });
    let fired = false;
    for (let t = 0; t < 10; t++) {
      fired = fired || d.process(JOLT, t * 20); // stays above threshold → one rising edge
    }
    expect(fired).toBe(false);
  });

  it("does not fire when jolts fall outside the window", () => {
    const d = new ShakeDetector({ requiredJolts: 3, windowMs: 1000 });
    expect(d.process(JOLT, 0)).toBe(false); // jolt 1
    d.process(REST, 50);
    expect(d.process(JOLT, 600)).toBe(false); // jolt 2
    d.process(REST, 650);
    // jolt 1 (t=0) is now older than 1000ms → only 2 jolts in window
    expect(d.process(JOLT, 1200)).toBe(false);
  });

  it("resets after firing so the next shake needs fresh jolts", () => {
    const d = new ShakeDetector({ requiredJolts: 2, windowMs: 1000 });
    d.process(JOLT, 0);
    d.process(REST, 50);
    expect(d.process(JOLT, 100)).toBe(true); // fires
    d.process(REST, 150);
    expect(d.process(JOLT, 200)).toBe(false); // only one fresh jolt
  });
});
