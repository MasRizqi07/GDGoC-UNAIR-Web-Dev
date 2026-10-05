const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './apps/web/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5500',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev --workspace=apps/web',
    url: 'http://127.0.0.1:5500/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
