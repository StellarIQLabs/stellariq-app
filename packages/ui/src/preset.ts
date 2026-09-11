import { colors, fontFamily } from './tokens.js';

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
        positive: colors.positive,
        negative: colors.negative,
        warning: colors.warning,
      },
      fontFamily: {
        sans: [...fontFamily.sans],
        mono: [...fontFamily.mono],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
      },
    },
  },
};
