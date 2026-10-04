import { defineConfig } from '@playwright/test';
const remote = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: remote || 'http://127.0.0.1:5178/',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: remote
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:5178/',
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
  reporter: [['list'], ['html', { open: 'never' }]],
});
