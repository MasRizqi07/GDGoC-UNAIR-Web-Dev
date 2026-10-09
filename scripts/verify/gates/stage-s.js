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

export const stageSGates = [
  ...standingGates,
  {
    id: 'stage-s-push-url',
    title: 'Git Push URL is Blocked (no_push)',
    async run() {
      const remotes = run('git remote -v');
      const pushLine = remotes.split('\n').find(l => l.includes('(push)'));
      if (!pushLine || !pushLine.includes('no_push')) {
        return { pass: false, output: `Git push URL is not set to no_push:\n${remotes}` };
      }
      return { pass: true, output: `Push URL verified blocked: ${pushLine.trim()}` };
    },
  },
  {
    id: 'stage-s-gitleaks-scan',
    title: 'Gitleaks History Scan Zero Findings',
    async run() {
      try {
        const out = run(`docker run --rm -v "${rootDir}:/repo" zricethezav/gitleaks:latest detect --source /repo --log-opts="--all" --redact --no-banner`);
        return { pass: true, output: out || 'Gitleaks scan complete: zero leaks found' };
      } catch (err) {
        return { pass: false, output: `Gitleaks detected secrets in history:\n${err.stdout || err.message}` };
      }
    },
  },
  {
    id: 'stage-s-no-tracked-secrets-or-dbs',
    title: 'No Tracked *.db, *.sqlite, or .env Files',
    async run() {
      const tracked = run('git ls-files').split('\n');
      const badFiles = tracked.filter(f => {
        const trimmed = f.trim();
        if (!trimmed) return false;
        if (trimmed === '.env.example') return false;
        return (
          trimmed === '.env' ||
          trimmed.endsWith('/.env') ||
          trimmed.endsWith('.db') ||
          trimmed.endsWith('.sqlite') ||
          trimmed.endsWith('.sqlite3')
        );
      });
      if (badFiles.length > 0) {
        return { pass: false, output: `Found tracked sensitive files:\n${badFiles.join('\n')}` };
      }
      return { pass: true, output: 'No tracked database or environment files in git index' };
    },
  },
  {
    id: 'stage-s-env-validator-tests',
    title: 'Environment Validator Test Suite Passes',
    async run() {
      const out = run('npm run test:e2e --workspace=apps/api -- test/env.validator.e2e-spec.ts');
      return { pass: true, output: out };
    },
  },
  {
    id: 'stage-s-s3-classification-clean',
    title: 'S3 Triage Classification in PROGRESS.md is CLEAN',
    async run() {
      const progress = fs.readFileSync(path.join(rootDir, 'PROGRESS.md'), 'utf8');
      if (!progress.includes('**CLEAN**')) {
        return { pass: false, output: 'PROGRESS.md does not record S5 classification as CLEAN' };
      }
      return { pass: true, output: 'PROGRESS.md records S5 classification as CLEAN' };
    },
  },
];
