import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/playwright',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000/api',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
});
