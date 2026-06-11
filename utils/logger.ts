/**
 * Gated logger.
 *
 * - log / info / debug are NO-OPS unless `__DEV__` is true, so they add zero
 *   overhead and leak no diagnostics in production builds.
 * - warn / error ALWAYS forward to console so production failures still surface.
 *
 * Dependency-free and standalone by design: error reporting can be wired to a
 * monitoring lib later without changing call sites.
 */

const noop = (..._args: unknown[]): void => {};

export const logger = {
  log: __DEV__ ? console.log.bind(console) : noop,
  info: __DEV__ ? console.info.bind(console) : noop,
  debug: __DEV__ ? console.debug.bind(console) : noop,
  warn: (...args: unknown[]): void => console.warn(...args),
  error: (...args: unknown[]): void => console.error(...args),
};
