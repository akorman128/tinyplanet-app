import { useState, useEffect } from "react";

let screenCaptureModule: typeof import("expo-screen-capture") | null = null;
try {
  screenCaptureModule = require("expo-screen-capture");
} catch {
  // Native module not available (e.g. Expo Go) — features will be no-ops
}

export function useScreenshotDetection() {
  const [warningVisible, setWarningVisible] = useState(false);

  // Prevent screen capture (blacks out screenshots/recordings)
  useEffect(() => {
    if (!screenCaptureModule) return;

    screenCaptureModule.preventScreenCaptureAsync();
    return () => {
      screenCaptureModule?.allowScreenCaptureAsync();
    };
  }, []);

  // Listen for screenshots and show warning
  useEffect(() => {
    if (!screenCaptureModule) return;

    const subscription = screenCaptureModule.addScreenshotListener(() => {
      setWarningVisible(true);
    });

    return () => subscription.remove();
  }, []);

  const dismissWarning = () => setWarningVisible(false);

  return { warningVisible, dismissWarning };
}
