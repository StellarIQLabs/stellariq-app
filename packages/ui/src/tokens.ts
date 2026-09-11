/** StellarIQ design tokens — the single source of truth for the web look. */

export const colors = {
  background: '#0a0e1a',
  surface: '#111827',
  surfaceRaised: '#1a2340',
  border: '#243056',
  text: '#e8ecf8',
  textMuted: '#8b93b0',
  accent: '#5b8cff',
  accentSoft: 'rgba(91, 140, 255, 0.12)',
  positive: '#22c55e',
  negative: '#ef4444',
  warning: '#f59e0b',
} as const;

export const radii = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  full: '9999px',
} as const;

export const fontFamily = {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
} as const;

export type ColorToken = keyof typeof colors;
