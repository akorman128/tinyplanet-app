import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";
import { ShakeDetector } from "./shakeDetector";

const UPDATE_INTERVAL_MS = 50; // 20 Hz

interface UseShakeDetectionOptions {
  enabled: boolean;
  onShake: () => void;
  threshold?: number;
  requiredJolts?: number;
  windowMs?: number;
}

export function useShakeDetection({
  enabled,
  onShake,
  threshold = 1.8,
  requiredJolts = 3,
  windowMs = 1000,
}: UseShakeDetectionOptions) {
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let subscription: { remove: () => void } | undefined;
    const detector = new ShakeDetector({ threshold, requiredJolts, windowMs });

    (async () => {
      const available = await Accelerometer.isAvailableAsync().catch(
        () => false
      );
      if (!available || cancelled) return;
      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscription = Accelerometer.addListener((sample) => {
        if (detector.process(sample, Date.now())) {
          onShakeRef.current();
        }
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, threshold, requiredJolts, windowMs]);
}
