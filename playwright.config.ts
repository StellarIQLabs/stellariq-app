import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node_modules/.bin/tsx src/index.ts',
      cwd: 'apps/api',
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { API_PORT: '4000', LOG_LEVEL: 'warn' },
    },
    {
      command: 'node_modules/.bin/next start -p 3000',
      cwd: 'apps/web',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { NEXT_PUBLIC_API_BASE_URL: 'http://localhost:4000' },
    },
  ],
});
