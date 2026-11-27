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
    baseURL: 'http://localhost:43171',
    browserName: 'chromium',
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
  },
  webServer: [
    { command: 'npm run dev:server', url: 'http://localhost:43170/api/health', env: { PORT: '43170', APP_ORIGIN: 'http://localhost:43171' }, reuseExistingServer: false, timeout: 60000 },
    { command: 'npm --workspace client run dev -- --host localhost --port 43171 --strictPort', url: 'http://localhost:43171', env: { REGMEUP_API_PROXY_TARGET: 'http://localhost:43170' }, reuseExistingServer: false, timeout: 60000 },
  ],
});
