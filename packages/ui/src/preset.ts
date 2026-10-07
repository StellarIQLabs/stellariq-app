import { colors, fontFamily, radii, shadows } from './tokens.js';

/**
 * Tailwind preset sharing StellarIQ tokens with every app.
 * Consumed via `presets: [stellariqPreset]` in app tailwind configs.
 */
export const stellariqPreset = {
  theme: {
    extend: {
      colors: {
        background: colors.background,
        surface: colors.surface,
        'surface-raised': colors.surfaceRaised,
        border: colors.border,
        text: colors.text,
        muted: colors.textMuted,
        accent: colors.accent,
        'accent-soft': colors.accentSoft,
        cyan: colors.cyan,
        positive: colors.positive,
        negative: colors.negative,
        warning: colors.warning,
      },
      fontFamily: {
        display: [...fontFamily.display],
        sans: [...fontFamily.sans],
        mono: [...fontFamily.mono],
      },
      borderRadius: {
        sm: radii.sm,
        md: radii.md,
        lg: radii.lg,
        xl: radii.xl,
      },
      boxShadow: {
        card: shadows.card,
        glow: shadows.glow,
      },
    },
  },
};
