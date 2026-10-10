import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import { standingGates } from './standing.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: rootDir, encoding: 'utf8', stdio: 'pipe', ...opts });
}

export const stage10Gates = [
  ...standingGates,
  {
    id: 'stage-10-checkpoints-complete',
    title: 'Verification Integrity: Checkpoint Tags Present & Remote Blocked',
    async run() {
      const tags = run('git tag -l "checkpoint/*"');
      const requiredCheckpoints = [
        'checkpoint/stage-s',
        'checkpoint/stage-r',
        'checkpoint/stage-7',
        'checkpoint/stage-8',
        'checkpoint/stage-9',
      ];

      const missing = requiredCheckpoints.filter(t => !tags.includes(t));
      if (missing.length > 0) {
        return { pass: false, output: `Missing required checkpoint tags: ${missing.join(', ')}` };
      }

      const remotePush = run('git remote get-url --push origin').trim();
      if (!remotePush.includes('no_push')) {
        return { pass: false, output: `Origin push URL must be blocked with no_push (current: ${remotePush})` };
      }

      return { pass: true, output: 'Verified all prerequisite checkpoint tags present and push remote blocked' };
    },
  },
  {
    id: 'stage-10-fresh-clone',
    title: 'Release Drill: Isolated Fresh-Clone Build & Test Verification',
    async run() {
      const tempBase = path.join(os.tmpdir(), `gdgoc-drill-${Date.now()}`);
      try {
        fs.mkdirSync(tempBase, { recursive: true });
        const cloneUrl = `file:///${rootDir.replace(/\\/g, '/')}`;

        // 1. Clone repository into isolated directory
        execSync(`git clone --no-hardlinks "${cloneUrl}" "${tempBase}"`, { stdio: 'pipe' });

        // 2. Setup env for test database connection
        const envSource = path.join(rootDir, 'apps/api/.env');
        if (fs.existsSync(envSource)) {
          fs.copyFileSync(envSource, path.join(tempBase, 'apps/api/.env'));
          fs.copyFileSync(envSource, path.join(tempBase, '.env'));
        }

        // 3. Run build and tests inside fresh clone
        const execOpts = { cwd: tempBase, encoding: 'utf8', stdio: 'pipe', timeout: 300000 };

        execSync('npm ci', execOpts);
        execSync('npx prisma generate --schema=apps/api/prisma/schema.prisma', execOpts);
        execSync('npm run build', execOpts);
        execSync('node --check apps/web/script.js', execOpts);
        execSync('node --test scripts/assert-test-db.test.js', execOpts);
        execSync('npm run test:e2e --workspace=apps/api', execOpts);
        execSync('npx playwright test', execOpts);

        return { pass: true, output: `Fresh-clone drill PASSED in isolated path: ${tempBase}` };
      } catch (err) {
        return { pass: false, output: `Fresh-clone drill failed: ${err.message}\n${err.stdout || ''}\n${err.stderr || ''}` };
      } finally {
        try {
          fs.rmSync(tempBase, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
        } catch (e) {}
      }
    },
  },
];

