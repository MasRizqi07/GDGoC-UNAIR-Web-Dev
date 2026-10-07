import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    fileParallelism: false,
    globalSetup: './test/global-setup.ts',
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://dev:devpassword@localhost:5432/gdgoc_test?schema=public'
    }
  },
});
