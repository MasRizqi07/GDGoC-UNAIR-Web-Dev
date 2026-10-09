import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { standingGates } from './standing.js';
import { findFiles } from '../ledger.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: rootDir, encoding: 'utf8', stdio: 'pipe', ...opts });
}

export const stage7Gates = [
  ...standingGates,
  {
    id: 'stage-7-security-headers',
    title: 'Security Headers & CSP Configured in Main API Entry',
    async run() {
      const mainPath = path.join(rootDir, 'apps/api/src/main.ts');
      const content = fs.readFileSync(mainPath, 'utf8');
      const requiredItems = [
        "frameAncestors: [\"'none'\"]",
        "scriptSrc: [\"'self'\"]",
        "crossOriginOpenerPolicy",
        "strict-origin-when-cross-origin",
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()",
        "trust proxy",
      ];
      const missing = requiredItems.filter(item => !content.includes(item));
      if (missing.length > 0) {
        return { pass: false, output: `main.ts missing required security configurations: ${missing.join(', ')}` };
      }
      return { pass: true, output: 'Security headers, CSP directives, permissions policy, and trust proxy verified in main.ts' };
    },
  },
  {
    id: 'stage-7-no-inline-scripts',
    title: 'Zero Inline Scripts in Any Web HTML Files',
    async run() {
      const htmlFiles = findFiles(path.join(rootDir, 'apps/web'), f => f.endsWith('.html'));
      const violations = [];
      for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        // Match <script> tags that don't have src= attribute
        const inlineScripts = content.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi);
        if (inlineScripts && inlineScripts.length > 0) {
          const rel = path.relative(rootDir, file).replace(/\\/g, '/');
          violations.push(`${rel} contains ${inlineScripts.length} inline script block(s)`);
        }
      }
      if (violations.length > 0) {
        return { pass: false, output: `Found inline scripts (violates CSP script-src 'self'):\n${violations.join('\n')}` };
      }
      return { pass: true, output: 'Zero inline scripts found across all web HTML files' };
    },
  },
  {
    id: 'stage-7-origin-check',
    title: 'Origin Check Guard Blocks Cross-Origin Mutating Requests',
    async run() {
      const out = run('npm run test:e2e --workspace=apps/api -- -t "Origin header"');
      return { pass: true, output: out };
    },
  },
  {
    id: 'stage-7-sandbox-xss-test',
    title: 'Sandbox and XSS Prevention Spec Passes',
    async run() {
      const out = run('npx playwright test apps/web/e2e/auth.spec.js -g "sandbox and XSS prevention"');
      return { pass: true, output: out };
    },
  },
  {
    id: 'stage-7-npm-audit-runtime',
    title: 'Zero High/Critical Vulnerabilities in Runtime Dependencies',
    async run() {
      const out = run('npm audit --omit=dev --audit-level=high');
      return { pass: true, output: out };
    },
  },
  {
    id: 'stage-7-lockfile-sync',
    title: 'Lockfile Synchronization (npm ci --dry-run)',
    async run() {
      const out = run('npm ci --dry-run');
      return { pass: true, output: out };
    },
  },
  {
    id: 'stage-7-dependabot-config',
    title: 'Dependabot Configuration Exists for npm, actions, docker',
    async run() {
      const depPath = path.join(rootDir, '.github/dependabot.yml');
      if (!fs.existsSync(depPath)) {
        return { pass: false, output: '.github/dependabot.yml does not exist' };
      }
      const content = fs.readFileSync(depPath, 'utf8');
      const required = ['npm', 'github-actions', 'docker', 'weekly'];
      const missing = required.filter(r => !content.includes(r));
      if (missing.length > 0) {
        return { pass: false, output: `dependabot.yml missing required targets: ${missing.join(', ')}` };
      }
      return { pass: true, output: 'Dependabot correctly configured for weekly npm, github-actions, and docker updates' };
    },
  },
  {
    id: 'stage-7-privacy-and-lifecycle',
    title: 'Privacy Notice Page and Account Deletion Lifecycle',
    async run() {
      const privacyPath = path.join(rootDir, 'apps/web/privacy.html');
      if (!fs.existsSync(privacyPath)) {
        return { pass: false, output: 'apps/web/privacy.html does not exist' };
      }
      const privacyContent = fs.readFileSync(privacyPath, 'utf8');
      const requiredPhrases = [
        '[OWNER: contact email]',
        'Email Address',
        'Password Hash',
        'Tasks / Todos',
        'Tutorial Completion',
        'Preferences',
      ];
      const missing = requiredPhrases.filter(p => !privacyContent.includes(p));
      if (missing.length > 0) {
        return { pass: false, output: `privacy.html missing required disclosures: ${missing.join(', ')}` };
      }
      const out = run('npx playwright test apps/web/e2e/auth.spec.js -g "delete account lifecycle via UI"');
      return { pass: true, output: `Privacy notice verified and deletion lifecycle test passed:\n${out}` };
    },
  },
];
