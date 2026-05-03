/**
 * Booking Flow Design Tokens — single source of truth.
 *
 * Mirrors the CSS custom properties declared in `src/styles/booking-tokens.css`.
 * Use TS tokens for inline styles / JS-driven values; use the CSS vars for
 * stylesheet-driven values. Keeping both in lockstep is intentional: components
 * never inline raw hex / px values.
 *
 * Scope: all booking-flow surfaces (search results, hotel detail, room select,
 * checkout). Prefixed `--bf-*` to avoid colliding with the legacy cream theme
 * (`--cream`, `--ink`) and the `.luxe` dark scope already in globals.css.
 *
 * Flag-gated v2 light theme is defined alongside `darkTheme` below; consumers
 * read tokens through CSS vars so the runtime swap is `[data-bf-theme]` only.
 */

export const colorDark = {
  bgPrimary: "#0a0a0a",
  bgSurface: "#0d0d0d",
  bgSurfaceSoft: "rgba(255, 255, 255, 0.025)",
  bgOverlay: "rgba(10, 10, 10, 0.95)",

  textPrimary: "#f5f1e8",
  textMuted: "rgba(255, 255, 255, 0.7)",
  textSoft: "rgba(255, 255, 255, 0.55)",
  textFaint: "rgba(255, 255, 255, 0.4)",

  accent: "#C9A961",
  accentSoft: "rgba(201, 169, 97, 0.15)",
  accentLine: "rgba(201, 169, 97, 0.18)",

  success: "#8fc295",
  warning: "#d4a373",
  danger: "#c98686",

  borderSoft: "rgba(255, 255, 255, 0.06)",
  borderDefault: "rgba(255, 255, 255, 0.12)",
  borderEmphasis: "rgba(255, 255, 255, 0.2)",
} as const;

// v2 light theme — flag-gated. Same shape as colorDark, inverted contrast.
// Wired into CSS vars under `[data-bf-theme="light"]`. Not the default.
export const colorLight = {
  bgPrimary: "#fafaf7",
  bgSurface: "#ffffff",
  bgSurfaceSoft: "rgba(10, 10, 10, 0.025)",
  bgOverlay: "rgba(250, 250, 247, 0.95)",

  textPrimary: "#1a1710",
  textMuted: "rgba(26, 23, 16, 0.72)",
  textSoft: "rgba(26, 23, 16, 0.55)",
  textFaint: "rgba(26, 23, 16, 0.4)",

  accent: "#9d7f3d",
  accentSoft: "rgba(157, 127, 61, 0.12)",
  accentLine: "rgba(157, 127, 61, 0.22)",

  success: "#3f7c54",
  warning: "#a26a2c",
  danger: "#9c4a4a",

  borderSoft: "rgba(10, 10, 10, 0.06)",
  borderDefault: "rgba(10, 10, 10, 0.12)",
  borderEmphasis: "rgba(10, 10, 10, 0.2)",
} as const;

export const fonts = {
  serif: '"Cormorant Garamond", Georgia, serif',
  sans: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
} as const;

export type TypeStep = {
  family: "serif" | "sans";
  italic?: boolean;
  weight: 400 | 500;
  size: number;
  line: number;
  letterSpacing?: string;
  uppercase?: boolean;
};

// Semantic type scale — desktop. Mobile drops 1–2px per step (see typeMobile).
export const type: Record<string, TypeStep> = {
  display:   { family: "serif", italic: true, weight: 400, size: 38, line: 42 },
  headline:  { family: "serif", italic: true, weight: 400, size: 26, line: 30 },
  title:     { family: "serif", italic: true, weight: 400, size: 22, line: 26 },
  subtitle:  { family: "serif", italic: true, weight: 400, size: 19, line: 24 },
  bodyLg:    { family: "sans",                weight: 400, size: 16, line: 26 },
  body:      { family: "sans",                weight: 400, size: 14, line: 22 },
  bodySm:    { family: "sans",                weight: 400, size: 13, line: 20 },
  caption:   { family: "sans",                weight: 400, size: 12, line: 18 },
  micro:     { family: "sans",                weight: 500, size: 11, line: 16, letterSpacing: "0.18em", uppercase: true },
  microSm:   { family: "sans",                weight: 500, size: 10, line: 14, letterSpacing: "0.16em", uppercase: true },
  microXs:   { family: "sans",                weight: 500, size: 9,  line: 12, letterSpacing: "0.18em", uppercase: true },
};

export const typeMobile: Record<string, TypeStep> = {
  display:   { ...type.display,  size: 32, line: 36 },
  headline:  { ...type.headline, size: 24, line: 28 },
  title:     { ...type.title,    size: 20, line: 24 },
  subtitle:  { ...type.subtitle, size: 17, line: 22 },
  bodyLg:    { ...type.bodyLg,   size: 15, line: 24 },
  body:      { ...type.body,     size: 13, line: 20 },
  bodySm:    { ...type.bodySm,   size: 12, line: 18 },
  caption:   { ...type.caption,  size: 11, line: 16 },
  micro:     { ...type.micro,    size: 10, line: 14 },
  microSm:   { ...type.microSm,  size: 9,  line: 12 },
  microXs:   { ...type.microXs,  size: 8,  line: 11 },
};

export const space = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 14,
  s5: 16,
  s6: 20,
  s7: 24,
  s8: 32,
  s10: 40,
  s12: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
} as const;

// CSS var names — keep in lockstep with src/styles/booking-tokens.css.
// Components may use these via `var(--bf-color-accent)` etc.
export const cssVar = {
  bgPrimary: "--bf-color-bg-primary",
  bgSurface: "--bf-color-bg-surface",
  bgSurfaceSoft: "--bf-color-bg-surface-soft",
  bgOverlay: "--bf-color-bg-overlay",

  textPrimary: "--bf-color-text-primary",
  textMuted: "--bf-color-text-muted",
  textSoft: "--bf-color-text-soft",
  textFaint: "--bf-color-text-faint",

  accent: "--bf-color-accent",
  accentSoft: "--bf-color-accent-soft",
  accentLine: "--bf-color-accent-line",

  success: "--bf-color-success",
  warning: "--bf-color-warning",
  danger: "--bf-color-danger",

  borderSoft: "--bf-color-border-soft",
  borderDefault: "--bf-color-border-default",
  borderEmphasis: "--bf-color-border-emphasis",

  fontSerif: "--bf-font-serif",
  fontSans: "--bf-font-sans",
} as const;

// Bundle export for any consumer that wants the full set.
export const bookingTokens = {
  color: colorDark,
  colorLight,
  fonts,
  type,
  typeMobile,
  space,
  radius,
  cssVar,
} as const;

export type BookingTokens = typeof bookingTokens;
