/** StellarIQ design tokens - the single source of truth for the web look. */

export const colors = {
  background: '#060a13',
  surface: '#0d1420',
  surfaceRaised: '#141d2e',
  border: '#232f45',
  text: '#e9eef7',
  textMuted: '#7f8aa3',
  accent: '#5b8cff',
  accentSoft: 'rgba(91, 140, 255, 0.12)',
  cyan: '#2bb7bd',
  positive: '#1fb574',
  negative: '#ef5a68',
  warning: '#e0a53a',
} as const;

/** Tight radii: a terminal reads as precise, not soft. */
export const radii = {
  sm: '3px',
  md: '5px',
  lg: '7px',
  xl: '10px',
  full: '9999px',
} as const;

export const fontFamily = {
  display: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
  sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
} as const;

export const shadows = {
  card: 'none',
  glow: 'none',
} as const;

export type ColorToken = keyof typeof colors;
