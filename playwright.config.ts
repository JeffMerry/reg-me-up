import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './docs/evidence/e2e/.playwright-artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: './docs/evidence/e2e/.playwright-report', open: 'never' }],
  ],
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:43171',
    browserName: 'chromium',
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
  },
  webServer: [
    { command: 'npm --workspace server run start:e2e', url: 'http://127.0.0.1:43170/api/ready', env: { PORT: '43170', APP_ORIGIN: 'http://127.0.0.1:43171' }, stdout: 'pipe', stderr: 'pipe', reuseExistingServer: false, timeout: 60000 },
    { command: 'npm --workspace client run dev -- --host 127.0.0.1 --port 43171 --strictPort', url: 'http://127.0.0.1:43171', env: { REGMEUP_API_PROXY_TARGET: 'http://127.0.0.1:43170' }, stdout: 'pipe', stderr: 'pipe', reuseExistingServer: false, timeout: 60000 },
  ],
});
