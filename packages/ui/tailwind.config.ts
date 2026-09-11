import type { Config } from 'tailwindcss';
import { colors, fontFamily } from './src/tokens.js';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../web/src/**/*.{ts,tsx}'],
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
  plugins: [],
};

export default config;
