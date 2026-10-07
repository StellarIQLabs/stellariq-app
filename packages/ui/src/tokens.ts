/** StellarIQ design tokens - the single source of truth for the web look. */

export const colors = {
  background: '#070b16',
  surface: '#0f1626',
  surfaceRaised: '#16203a',
  border: '#26324f',
  text: '#eef2fb',
  textMuted: '#8a93ac',
  accent: '#5b8cff',
  accentSoft: 'rgba(91, 140, 255, 0.14)',
  cyan: '#35d0d6',
  positive: '#2fd27e',
  negative: '#ff5a6a',
  warning: '#f7b955',
} as const;

export const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
} as const;

export const fontFamily = {
  display: ['Sora', 'system-ui', 'sans-serif'],
  sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
} as const;

export const shadows = {
  card: '0 1px 2px rgba(0, 0, 0, 0.40), 0 12px 32px rgba(0, 0, 0, 0.35)',
  glow: '0 0 40px rgba(91, 140, 255, 0.18)',
} as const;

export type ColorToken = keyof typeof colors;
