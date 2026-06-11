// Crash/error reporting scaffold.
//
// Sentry is OPTIONAL: it is loaded lazily via dynamic import so the app still
// works (and `tsc` stays green) even when "@sentry/react-native" is not
// installed. A static top-level import would break the type-check until the
// package is added. Typing the module as `any` keeps it decoupled.

let Sentry: any = null;
let initialized = false;

/**
 * Initialize crash reporting. Safe to call at module scope.
 *
 * No-op unless EXPO_PUBLIC_SENTRY_DSN is set. If the Sentry package is not
 * installed, the dynamic import fails silently and the app continues without
 * crash reporting.
 */
export async function initMonitoring(): Promise<void> {
  if (initialized) {
    return;
  }

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  try {
    // @ts-ignore - optional dependency; may not be installed. Resolved lazily
    // at runtime, and the `any` type keeps the rest of the module type-safe.
    Sentry = await import("@sentry/react-native");
    Sentry.init({ dsn });
    initialized = true;
  } catch (error) {
    Sentry = null;
    if (__DEV__) {
      console.error("Failed to initialize Sentry monitoring:", error);
    }
  }
}

/**
 * Report an error to the configured crash reporter.
 *
 * Forwards to Sentry when initialized; otherwise logs to the console in dev.
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (initialized && Sentry) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
    return;
  }

  if (__DEV__) {
    console.error("captureError:", error, context ?? "");
  }
}
