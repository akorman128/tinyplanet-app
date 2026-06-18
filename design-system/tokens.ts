/**
 * Design System Tokens
 *
 * Numeric scales for React Native style props that can't use Tailwind utility
 * classes (StyleSheet objects, animated values, native component props).
 *
 * Tailwind utilities (`rounded-*`, `shadow-*`, `gap-*`) remain the preferred way
 * to style via `className`; these tokens are for the inline `style={{}}` cases.
 */

/** Border radius scale. Mirrors Tailwind: lg=8, xl=12, 2xl=16, 3xl=20. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

/** Icon size scale (px). Button uses sm/md/lg; xl/2xl for headers & markers. */
export const iconSize = {
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
  "2xl": 28,
} as const;

/** Elevation presets — iOS shadow* props + Android elevation, applied together. */
export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

export type Radius = keyof typeof radius;
export type IconSize = keyof typeof iconSize;
export type Shadow = keyof typeof shadow;
