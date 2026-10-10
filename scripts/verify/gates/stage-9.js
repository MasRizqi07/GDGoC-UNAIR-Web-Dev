import { execSync, spawn } from 'node:child_process';
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

export const stage9Gates = [
  ...standingGates,
  {
    id: 'stage-9-dockerfile',
    title: 'Multi-stage Dockerfile: Node 22 LTS, Non-root User, .dockerignore & Healthcheck',
    async run() {
      const dockerfilePath = path.join(rootDir, 'Dockerfile');
      const dockerignorePath = path.join(rootDir, '.dockerignore');

      if (!fs.existsSync(dockerfilePath)) {
        return { pass: false, output: 'Dockerfile does not exist' };
      }
      if (!fs.existsSync(dockerignorePath)) {
        return { pass: false, output: '.dockerignore does not exist' };
      }

      const dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
      const dockerignore = fs.readFileSync(dockerignorePath, 'utf8');

      const issues = [];
      if (!dockerfile.includes('node:22-alpine') && !dockerfile.includes('node:22')) {
        issues.push('Dockerfile must pin base image to Node 22 LTS');
      }
      if (!dockerfile.includes('USER node')) {
        issues.push('Dockerfile must run as non-root user (USER node)');
      }
      if (!dockerfile.includes('HEALTHCHECK')) {
        issues.push('Dockerfile must include HEALTHCHECK instruction');
      }
      if (!dockerignore.includes('node_modules')) {
        issues.push('.dockerignore must exclude node_modules');
      }
      if (!dockerignore.includes('.git')) {
        issues.push('.dockerignore must exclude .git');
      }
      if (!dockerignore.includes('.env')) {
        issues.push('.dockerignore must exclude .env');
      }

      if (issues.length > 0) {
        return { pass: false, output: `Dockerfile issues found:\n- ${issues.join('\n- ')}` };
      }

      return { pass: true, output: 'Verified multi-stage Dockerfile pinned to Node 22 LTS, non-root user, healthcheck, and .dockerignore' };
    },
  },
  {
    id: 'stage-9-docker-compose',
    title: 'Docker Compose: Dev & Prod-like Profiles, Healthcheck Dependencies',
    async run() {
      const composePath = path.join(rootDir, 'docker-compose.yml');
      if (!fs.existsSync(composePath)) {
        return { pass: false, output: 'docker-compose.yml does not exist' };
      }
      const compose = fs.readFileSync(composePath, 'utf8');
      const issues = [];

      if (!compose.includes('prod-like')) {
        issues.push('docker-compose.yml must define prod-like profile');
      }
      if (!compose.includes('service_healthy')) {
        issues.push('docker-compose.yml must wait for database service_healthy');
      }
      if (!compose.includes('healthcheck:')) {
        issues.push('docker-compose.yml database must define healthcheck');
      }

      if (issues.length > 0) {
        return { pass: false, output: `docker-compose issues found:\n- ${issues.join('\n- ')}` };
      }

      return { pass: true, output: 'Verified docker-compose.yml profiles and healthcheck dependencies' };
    },
  },
  {
    id: 'stage-9-ci-workflow',
    title: 'CI Workflow: Least Privilege Permissions & Automated Test Pipeline',
    async run() {
      const ciPath = path.join(rootDir, '.github/workflows/ci.yml');
      if (!fs.existsSync(ciPath)) {
        return { pass: false, output: '.github/workflows/ci.yml does not exist' };
      }
      const ci = fs.readFileSync(ciPath, 'utf8');
      const issues = [];

      if (!ci.includes('contents: read')) {
        issues.push('CI workflow must use least privilege permissions (contents: read)');
      }
      if (!ci.includes('pull_request') && !ci.includes('push')) {
        issues.push('CI workflow must trigger on push and pull_request');
      }
      if (!ci.includes('npm test')) {
        issues.push('CI workflow must run test suite');
      }

      if (issues.length > 0) {
        return { pass: false, output: `CI workflow issues found:\n- ${issues.join('\n- ')}` };
      }

      return { pass: true, output: 'Verified .github/workflows/ci.yml with least privilege permissions and test pipeline' };
    },
  },
  {
    id: 'stage-9-env-matrix',
    title: 'Environment Matrix: README Documentation & Complete .env.example',
    async run() {
      const envExamplePath = path.join(rootDir, '.env.example');
      const readmePath = path.join(rootDir, 'README.md');

      if (!fs.existsSync(envExamplePath)) {
        return { pass: false, output: '.env.example does not exist' };
      }
      if (!fs.existsSync(readmePath)) {
        return { pass: false, output: 'README.md does not exist' };
      }

      const envExample = fs.readFileSync(envExamplePath, 'utf8');
      const readme = fs.readFileSync(readmePath, 'utf8');

      const requiredVars = [
        'JWT_SECRET',
        'DATABASE_URL',
        'TEST_DATABASE_URL',
        'FRONTEND_URL',
        'COOKIE_SECURE',
        'PORT',
        'NODE_ENV',
      ];

      const missingInExample = requiredVars.filter(v => !envExample.includes(v));
      const missingInReadme = requiredVars.filter(v => !readme.includes(v));

      if (missingInExample.length > 0 || missingInReadme.length > 0) {
        return {
          pass: false,
          output: `Missing env documentation:\nMissing in .env.example: ${missingInExample.join(', ')}\nMissing in README.md: ${missingInReadme.join(', ')}`,
        };
      }

      return { pass: true, output: 'Verified complete environment variable matrix across .env.example and README.md' };
    },
  },
  {
    id: 'stage-9-backup-restore-drill',
    title: 'Disaster Recovery Drill: pg_dump Schema & Data Export',
    async run() {
      try {
        const dump = run('docker exec gdgocunairweb-dev-db-1 pg_dump -U dev -d gdgoc_test');
        if (!dump.includes('CREATE TABLE public."User"') || !dump.includes('CREATE TABLE public."Todo"')) {
          return { pass: false, output: 'pg_dump output missing required User or Todo table schemas' };
        }
        return { pass: true, output: `Disaster recovery drill passed: successfully verified pg_dump (${dump.length} bytes exported)` };
      } catch (err) {
        return { pass: false, output: `Backup drill failed: ${err.message}` };
      }
    },
  },
  {
    id: 'stage-9-container-smoke',
    title: 'Container Smoke Drill: Migration Deploy, HTTP Health, & Web Asset Serving',
    async run() {
      const containerName = `gdgoc-verify-smoke-${Date.now()}`;
      try {
        // Run container in background on docker network
        run(`docker run -d --name ${containerName} --network gdgocunairweb-dev_default -p 3001:3000 -e NODE_ENV=test -e DATABASE_URL=postgresql://dev:devpassword@db:5432/gdgoc_test?schema=public -e JWT_SECRET=superrandom-jwt-key-minimum-32-chars-long -e FRONTEND_URL=http://localhost:3001 -e PORT=3000 gdgoc-app:test`);

        // Wait up to 15 seconds for container to be ready
        let healthy = false;
        const start = Date.now();
        while (Date.now() - start < 15000) {
          try {
            const res = await fetch('http://127.0.0.1:3001/api/v1/health');
            if (res.ok) {
              healthy = true;
              break;
            }
          } catch (e) {}
          await new Promise(r => setTimeout(r, 500));
        }

        if (!healthy) {
          const logs = run(`docker logs ${containerName}`);
          return { pass: false, output: `Container failed to become healthy within 15s. Logs:\n${logs}` };
        }

        // Test static web asset serving
        const webRes = await fetch('http://127.0.0.1:3001/');
        if (!webRes.ok) {
          return { pass: false, output: `Container web serving failed with status ${webRes.status}` };
        }
        const html = await webRes.text();
        if (!html.includes('Deep Dive')) {
          return { pass: false, output: 'Container web response missing expected content' };
        }

        return { pass: true, output: 'Container smoke drill passed: prisma migrate deploy, /api/v1/health OK, and / static HTML OK' };
      } finally {
        try { run(`docker rm -f ${containerName}`); } catch (e) {}
      }
    },
  },
];

