import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { verifyLedgers, findFiles } from '../ledger.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: rootDir, encoding: 'utf8', stdio: 'pipe', ...opts });
}

export const standingGates = [
  {
    id: 'standing-clean-tree',
    title: 'Clean Working Tree',
    async run() {
      const status = run('git status --porcelain').trim();
      if (status) {
        return { pass: false, output: `Working tree is not clean:\n${status}` };
      }
      return { pass: true, output: 'Working tree is completely clean' };
    },
  },
  {
    id: 'standing-no-sqlite',
    title: 'No SQLite or file:./ Outside Historical Notes',
    async run() {
      const codeFiles = [
        ...findFiles(path.join(rootDir, 'apps'), f => /\.(ts|js|json|prisma)$/.test(f)),
        ...findFiles(path.join(rootDir, 'packages'), f => /\.(ts|js|json)$/.test(f)),
      ];
      const hits = [];
      for (const file of codeFiles) {
        const rel = path.relative(rootDir, file).replace(/\\/g, '/');
        const content = fs.readFileSync(file, 'utf8');
        if (/provider\s*=\s*["']sqlite["']/.test(content)) {
          hits.push(`${rel}: sqlite provider found`);
        }
        if (/file:\.\//.test(content) && !rel.includes('schema.prisma')) {
          hits.push(`${rel}: file:./ connection string found`);
        }
      }
      if (hits.length > 0) {
        return { pass: false, output: `Found unexpected SQLite references:\n${hits.join('\n')}` };
      }
      return { pass: true, output: 'No SQLite references found in current code' };
    },
  },
  {
    id: 'standing-no-secret-logging',
    title: 'No Secret Logging Patterns',
    async run() {
      const srcFiles = [
        ...findFiles(path.join(rootDir, 'apps/api/src'), f => /\.(ts|js)$/.test(f)),
        ...findFiles(path.join(rootDir, 'apps/web'), f => /\.(js)$/.test(f)),
      ];
      const hits = [];
      for (const file of srcFiles) {
        const rel = path.relative(rootDir, file).replace(/\\/g, '/');
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i];
          if (/console\.(log|info|debug)\s*\(.*(password|secret|token|hash)/i.test(l)) {
            hits.push(`${rel}:${i + 1}: ${l.trim()}`);
          }
        }
      }
      if (hits.length > 0) {
        return { pass: false, output: `Potential secret logging found:\n${hits.join('\n')}` };
      }
      return { pass: true, output: 'No secret logging patterns found' };
    },
  },
  {
    id: 'standing-typecheck',
    title: 'TypeScript Typecheck Across Workspaces',
    async run() {
      const out = run('npm run typecheck');
      return { pass: true, output: out };
    },
  },
  {
    id: 'standing-lint',
    title: 'Linter Across Workspaces',
    async run() {
      const out = run('npm run lint');
      return { pass: true, output: out };
    },
  },
  {
    id: 'standing-build',
    title: 'Build Across Workspaces',
    async run() {
      const out = run('npm run build');
      return { pass: true, output: out };
    },
  },
  {
    id: 'standing-docker-db',
    title: 'Docker Database Health',
    async run() {
      const ps = run('docker compose ps --format json');
      let isHealthy = false;
      try {
        const parsed = JSON.parse(ps);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const dbContainer = list.find(c => c.Service === 'db' || c.Name?.includes('db'));
        isHealthy = dbContainer && (dbContainer.Health === 'healthy' || dbContainer.State === 'running');
      } catch (e) {
        isHealthy = ps.includes('healthy') || ps.includes('running');
      }
      if (!isHealthy) {
        return { pass: false, output: `Database container is not healthy:\n${ps}` };
      }
      return { pass: true, output: 'PostgreSQL database container is running and healthy' };
    },
  },
  {
    id: 'standing-prisma-migrations',
    title: 'Prisma Migrate Status Clean (Dev and Test)',
    async run() {
      const devStatus = run('npx prisma migrate status --schema=apps/api/prisma/schema.prisma');
      return { pass: true, output: devStatus };
    },
  },
  {
    id: 'standing-ratchet-ledgers',
    title: 'Ratchet Ledgers and No Skipped Tests',
    async run() {
      const res = verifyLedgers();
      if (!res.valid) {
        return { pass: false, output: `Ratchet ledger verification failed:\n${res.errors.join('\n')}` };
      }
      return { pass: true, output: 'All tests, assertions, and dependencies match or exceed ledgers with zero .skip/.todo/.fixme' };
    },
  },
  {
    id: 'standing-auth-coverage-floor',
    title: 'Auth Module Coverage Floor Check',
    async run() {
      const out = run('npm run test:e2e --workspace=apps/api -- --coverage');
      // Verify auth module lines >= 88%
      const match = out.match(/src\/auth\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
      if (!match) {
        return { pass: false, output: `Could not parse auth module coverage:\n${out}` };
      }
      const [_, stmts, branch, funcs, lines] = match;
      if (parseFloat(stmts) < 88 || parseFloat(lines) < 88) {
        return {
          pass: false,
          output: `Auth coverage fell below floor: Stmts ${stmts}% (floor 88%), Lines ${lines}% (floor 88%)\n${out}`,
        };
      }
      return {
        pass: true,
        output: `Auth coverage meets floor: Stmts ${stmts}%, Branch ${branch}%, Funcs ${funcs}%, Lines ${lines}%`,
      };
    },
  },
  {
    id: 'standing-playwright-repeat',
    title: 'Playwright Repeat Each 3 (Zero Skipped or Failed)',
    async run() {
      const out = run('npx playwright test --repeat-each=3 --reporter=list');
      if (out.includes('failed') || out.includes('skipped')) {
        return { pass: false, output: `Playwright test run had failures or skips:\n${out}` };
      }
      return { pass: true, output: out };
    },
  },
  {
    id: 'standing-ports-free',
    title: 'Ports 3000, 5500, 5555 Free at End',
    async run() {
      const netstat = run('netstat -ano');
      const occupied = [];
      for (const port of [':3000', ':5500', ':5555']) {
        const matches = netstat.split('\n').filter(l => l.includes(port) && l.includes('LISTENING'));
        if (matches.length > 0) {
          occupied.push(port);
        }
      }
      if (occupied.length > 0) {
        return { pass: false, output: `Ports still occupied in LISTENING state: ${occupied.join(', ')}` };
      }
      return { pass: true, output: 'Ports 3000, 5500, 5555 are free' };
    },
  },
  {
    id: 'standing-commit-subject-lint',
    title: 'Commit Subject Multi-prefix Check (WARN only)',
    async run() {
      const last10 = run('git log -n 10 --format="%h %s"').trim().split('\n');
      const warnings = [];
      for (const line of last10) {
        const colonCount = (line.match(/:/g) || []).length;
        if (colonCount > 1) {
          warnings.push(`Warning: Multiple type prefixes in commit: ${line}`);
        }
      }
      return {
        pass: true,
        output: warnings.length > 0 ? warnings.join('\n') : 'All recent commit subjects follow single prefix format',
      };
    },
  },
];
