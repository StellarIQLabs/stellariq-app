import type { Config } from 'tailwindcss';
import { stellariqPreset } from '@stellariq/ui';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [stellariqPreset as Config],
};

export default config;
