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
  globalSetup: require.resolve('./scripts/assert-test-db.js'),
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run start:prod --workspace=apps/api',
    url: 'http://127.0.0.1:3000/api/v1/health',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://dev:devpassword@127.0.0.1:5432/gdgoc_test?schema=public'
    }
  },
});
