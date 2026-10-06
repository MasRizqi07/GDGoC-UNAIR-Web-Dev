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
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npx cross-env DATABASE_URL="file:./test.db" npm run start --workspace=apps/api',
    url: 'http://127.0.0.1:3000/api/v1/health',
    reuseExistingServer: true,
    timeout: 60_000,
    env: {
      DATABASE_URL: 'file:./test.db'
    }
  },
});
