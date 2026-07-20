import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: __dirname,
  testMatch: 'FS-ai.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:5176',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'off',
    screenshot: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
