/**
 * Design System Color Palette
 *
 * This file defines the color palette used throughout the application.
 * All colors are based on Tailwind CSS default colors.
 */

export const colors = {
  // Primary brand color
  primary: {
    light: "blue-200", // Light backgrounds, icons
    DEFAULT: "blue-500", // Primary buttons, headings
    dark: "blue-600", // Active/pressed states
  },

  // Neutral colors
  neutral: {
    gray50: "gray-50", // Subtle backgrounds, hover states
    gray300: "gray-300", // Borders, dividers
    gray400: "gray-400", // Placeholders, disabled text
    gray500: "gray-500", // Captions, secondary text
    gray600: "gray-600", // Subheadings, secondary content
    gray700: "gray-700", // Labels, form labels
    gray900: "gray-900", // Body text, primary content
  },

  // Semantic colors
  error: {
    DEFAULT: "red-500", // Error text, error borders
  },

  // Base colors
  white: "white", // Backgrounds, contrast text
  black: "black", // Rarely used, for maximum contrast

  // Special hex values (for React Native components that need hex)
  hex: {
    // Primary colors - brand blue palette (light → dark, base/brand at 500)
    blue50: "#f0f7ff",
    blue100: "#e6f2ff",
    blue200: "#c7e2ff",
    blue300: "#94c7ff",
    blue400: "#4da2ff",
    blue500: "#007aff", // Main brand color (base)
    blue600: "#0064d1",
    blue700: "#004ea3",
    blue800: "#003875",
    blue900: "#002247",

    // Neutral colors
    gray300: "#d1d5db", // gray-300
    gray500: "#6b7280", // gray-500
    gray600: "#4b5563", // gray-600
    gray900: "#111827", // gray-900 equivalent
    placeholder: "#9CA3AF", // gray-400 equivalent
    white: "#ffffff",
    black: "#000000",
    cream: "#faf9f5",

    // Hang accent ramp (coral)
    coral: "#ff6b6b", // Hang primary CTA, pin ring/dot, accent icons
    coralPressed: "#e8475f", // Active/pressed CTA state
    coralTint: "#ffedec", // "Hang" badge background, soft surfaces
    coralShadow: "rgba(255,107,107,0.4)", // Drop shadow under filled coral button

    // Semantic colors
    error: "#ef4444", // red-500 equivalent
  },
} as const;

/**
 * Color usage guidelines:
 *
 * Primary:
 * - Use primary.DEFAULT for main buttons, headings, and key UI elements
 * - Use primary.dark for active/pressed states
 * - Use primary.light for subtle backgrounds and decorative elements
 *
 * Neutral:
 * - 900: Body text, primary content
 * - 700: Form labels, important secondary text
 * - 600: Subheadings, less important content
 * - 500: Captions, tertiary text
 * - 400: Placeholders, disabled states
 * - 300: Borders, dividers, separators
 * - 50: Subtle backgrounds, hover states
 *
 * Error:
 * - Use for validation errors, error messages, and destructive actions
 */
