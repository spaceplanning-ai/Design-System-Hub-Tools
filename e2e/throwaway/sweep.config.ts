import { resolve } from 'node:path';

import { defineConfig, devices } from '@playwright/test';

const PORT = 5199;
const BASE_URL = `http://127.0.0.1:${String(PORT)}`;

export default defineConfig({
  testDir: __dirname,
  testMatch: 'route-sweep.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 20 * 60 * 1000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  // 러너 산출물은 이미 git·prettier 가 함께 무시하는 자리에 쓴다 (.gitignore · .prettierignore
  // 의 e2e/test-results/**). 여기 말고 throwaway/ 아래에 쓰면 러너가 뱉는 압축 JSON
  // (.last-run.json) 이 format:check 를 반려시킨다 — 진단 도구가 게이트를 깨는 셈이 된다.
  outputDir: resolve(__dirname, '..', 'test-results', 'route-sweep'),
  use: {
    baseURL: BASE_URL,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'off',
    screenshot: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm --filter @tds/admin exec vite --host 127.0.0.1 --port ${String(PORT)} --strictPort`,
    cwd: resolve(__dirname, '..', '..'),
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
