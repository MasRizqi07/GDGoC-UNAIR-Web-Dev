import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { standingGates } from './standing.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: rootDir, encoding: 'utf8', stdio: 'pipe', ...opts });
}

export const stageRGates = [
  ...standingGates,
  {
    id: 'stage-r-db-postgres-only',
    title: 'Prisma Schema Configured for PostgreSQL Only',
    async run() {
      const schemaPath = path.join(rootDir, 'apps/api/prisma/schema.prisma');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      if (!schema.includes('provider = "postgresql"') && !schema.includes("provider = 'postgresql'")) {
        return { pass: false, output: `Prisma schema does not use postgresql provider:\n${schema}` };
      }
      return { pass: true, output: 'Prisma schema correctly configured with provider = "postgresql"' };
    },
  },
  {
    id: 'stage-r-test-db-guard',
    title: 'Test DB Safety Guard Verification',
    async run() {
      const out = run('node --test scripts/assert-test-db.test.js');
      return { pass: true, output: out };
    },
  },
  {
    id: 'stage-r-api-e2e-postgres',
    title: 'API E2E Tests on PostgreSQL (Phases 4 & 5)',
    async run() {
      const out = run('npm run test:e2e --workspace=apps/api');
      return { pass: true, output: out };
    },
  },
  {
    id: 'stage-r-same-origin-assets',
    title: 'Same-Origin Web Assets Configured and Built',
    async run() {
      const distIndex = path.join(rootDir, 'apps/web/dist/index.html');
      if (!fs.existsSync(distIndex)) {
        return { pass: false, output: `Built web assets missing: ${distIndex} not found` };
      }
      const appModule = fs.readFileSync(path.join(rootDir, 'apps/api/src/app.module.ts'), 'utf8');
      if (!appModule.includes('ServeStaticModule')) {
        return { pass: false, output: 'ServeStaticModule not configured in AppModule' };
      }
      return { pass: true, output: 'Web assets built in apps/web/dist and served via ServeStaticModule in AppModule' };
    },
  },
  {
    id: 'stage-r-no-sqlite-deps',
    title: 'Zero SQLite Dependencies Across Workspaces',
    async run() {
      const pkgFiles = [
        path.join(rootDir, 'package.json'),
        path.join(rootDir, 'apps/api/package.json'),
        path.join(rootDir, 'apps/web/package.json'),
      ];
      for (const p of pkgFiles) {
        if (!fs.existsSync(p)) continue;
        const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
        const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        for (const dep of Object.keys(allDeps)) {
          if (/sqlite/i.test(dep)) {
            return { pass: false, output: `Found SQLite dependency ${dep} in ${p}` };
          }
        }
      }
      return { pass: true, output: 'Zero SQLite dependencies found across all package.json files' };
    },
  },
  {
    id: 'stage-r-env-example',
    title: 'Environment Template (.env.example) Completeness',
    async run() {
      const examplePath = path.join(rootDir, '.env.example');
      if (!fs.existsSync(examplePath)) {
        return { pass: false, output: '.env.example does not exist' };
      }
      const content = fs.readFileSync(examplePath, 'utf8');
      const requiredVars = ['DATABASE_URL', 'TEST_DATABASE_URL', 'JWT_SECRET', 'PORT'];
      const missing = requiredVars.filter(v => !content.includes(v));
      if (missing.length > 0) {
        return { pass: false, output: `.env.example missing required variables: ${missing.join(', ')}` };
      }
      return { pass: true, output: '.env.example contains all required environment variable placeholders' };
    },
  },
];
