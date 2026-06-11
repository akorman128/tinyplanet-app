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

// `__DEV__` is a React Native runtime global and is undefined in non-RN
// contexts (e.g. the vitest/jsdom test environment). Guard the access so the
// logger can be imported anywhere without throwing a ReferenceError.
const isDev =
  typeof __DEV__ !== "undefined"
    ? __DEV__
    : process.env.NODE_ENV !== "production";

export const logger = {
  log: isDev ? console.log.bind(console) : noop,
  info: isDev ? console.info.bind(console) : noop,
  debug: isDev ? console.debug.bind(console) : noop,
  warn: (...args: unknown[]): void => console.warn(...args),
  error: (...args: unknown[]): void => console.error(...args),
};
