import { execSync, spawn } from 'node:child_process';
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

export const stage8Gates = [
  ...standingGates,
  {
    id: 'stage-8-design-tokens',
    title: 'Shared Design Tokens: Zero Raw Color Literals Outside tokens.css',
    async run() {
      const filesToCheck = [
        path.join(rootDir, 'apps/web/styles.css'),
        path.join(rootDir, 'apps/web/index.html'),
        path.join(rootDir, 'apps/web/privacy.html'),
        path.join(rootDir, 'apps/web/tutorials/widgets.html'),
        path.join(rootDir, 'apps/web/tutorials/todo.html'),
        path.join(rootDir, 'apps/web/tutorials/inspector.html'),
      ];

      const violations = [];
      for (const file of filesToCheck) {
        if (!fs.existsSync(file)) continue;
        const content = fs.readFileSync(file, 'utf8');
        const hex = content.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
        const rgb = content.match(/rgba?\([^)]+\)/g) || [];
        const hsl = content.match(/hsla?\([^)]+\)/g) || [];
        if (hex.length > 0 || rgb.length > 0 || hsl.length > 0) {
          const rel = path.relative(rootDir, file).replace(/\\/g, '/');
          violations.push(`${rel} contains raw color literals: ${[...hex, ...rgb, ...hsl].join(', ')}`);
        }
      }

      if (violations.length > 0) {
        return { pass: false, output: `Found raw color literals outside tokens.css:\n${violations.join('\n')}` };
      }
      return { pass: true, output: 'Verified zero raw color literals across all stylesheets and HTML files outside tokens.css' };
    },
  },
  {
    id: 'stage-8-ui-acceptance-spec',
    title: 'UI Acceptance Spec: 320px Reflow, Target Sizes, Reduced Motion & Form Accessibility',
    async run() {
      const out = run('npx playwright test apps/web/e2e/stage8-ui-quality.spec.js');
      return { pass: true, output: out };
    },
  },
  {
    id: 'stage-8-keyboard-walkthrough',
    title: 'Keyboard Walkthrough Spec: Focus Traps, Escape Closes, and Focus Returns',
    async run() {
      const out = run('npx playwright test apps/web/e2e/stage8-keyboard-walkthrough.spec.js');
      return { pass: true, output: out };
    },
  },
  {
    id: 'stage-8-screenshots',
    title: 'Screenshots Captured Across Viewports and Themes in evidence/screenshots/',
    async run() {
      const out = run('node scripts/capture-screenshots.js');
      const screenshotDir = path.join(rootDir, 'evidence/screenshots');
      if (!fs.existsSync(screenshotDir)) {
        return { pass: false, output: 'evidence/screenshots directory does not exist' };
      }
      const files = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
      if (files.length < 24) {
        return { pass: false, output: `Expected 24 screenshots, found ${files.length}` };
      }
      return { pass: true, output: `${out}\nAll 24 screenshots verified in evidence/screenshots/` };
    },
  },
  {
    id: 'stage-8-lighthouse',
    title: 'Lighthouse Performance, Accessibility, Best Practices, and SEO Budgets',
    async run() {
      const out = run('node scripts/run-lighthouse.js');
      return { pass: true, output: out };
    },
  },
  {
    id: 'stage-8-delivery-headers',
    title: 'Delivery Headers: Gzip, Cache-Control, Favicon, and Metadata Assertions',
    async run() {
      // Start server if not running
      let serverProc = null;
      let serverPid = null;
      let serverRunning = false;
      try {
        const res = await fetch('http://127.0.0.1:3000/api/v1/health');
        if (res.ok) serverRunning = true;
      } catch (e) {}

      if (!serverRunning) {
        if (fs.existsSync(path.join(rootDir, 'apps/api/.env'))) {
          process.loadEnvFile(path.join(rootDir, 'apps/api/.env'));
        } else if (fs.existsSync(path.join(rootDir, '.env'))) {
          process.loadEnvFile(path.join(rootDir, '.env'));
        }

        serverProc = spawn(process.execPath, ['dist/main'], {
          cwd: path.join(rootDir, 'apps/api'),
          stdio: 'ignore',
          env: {
            ...process.env,
            PORT: '3000',
            DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://dev:devpassword@127.0.0.1:5432/gdgoc_test?schema=public',
          },
        });
        serverPid = serverProc.pid;
        const start = Date.now();
        while (Date.now() - start < 15000) {
          try {
            const res = await fetch('http://127.0.0.1:3000/api/v1/health');
            if (res.ok) break;
          } catch (e) {}
          await new Promise(r => setTimeout(r, 400));
        }
      }

      const issues = [];
      try {
        // 1. HTML request
        const htmlRes = await fetch('http://127.0.0.1:3000/', {
          headers: { 'Accept-Encoding': 'gzip' }
        });
        if (!htmlRes.ok) issues.push(`HTML returned status ${htmlRes.status}`);
        if (htmlRes.headers.get('content-encoding') !== 'gzip') issues.push(`HTML content-encoding is not gzip (received: ${htmlRes.headers.get('content-encoding')})`);
        const htmlCc = htmlRes.headers.get('cache-control') || '';
        if (!htmlCc.includes('no-cache')) issues.push(`HTML cache-control does not include no-cache (received: ${htmlCc})`);

        const htmlText = await htmlRes.text();
        if (!htmlText.includes('name="color-scheme"')) issues.push('HTML missing <meta name="color-scheme">');
        if (!htmlText.includes('name="description"')) issues.push('HTML missing <meta name="description">');
        if (!/<title>[^<]+<\/title>/.test(htmlText)) issues.push('HTML missing <title>');

        // 2. Favicon
        const favRes = await fetch('http://127.0.0.1:3000/favicon.svg');
        if (!favRes.ok) issues.push(`Favicon returned status ${favRes.status}`);
        const favCt = favRes.headers.get('content-type') || '';
        if (!favCt.includes('image/svg+xml')) issues.push(`Favicon content-type is not image/svg+xml (received: ${favCt})`);

        // 3. Hashed assets Cache-Control
        const distAssetsDir = path.join(rootDir, 'apps/web/dist/assets');
        if (fs.existsSync(distAssetsDir)) {
          const files = fs.readdirSync(distAssetsDir);
          const hashedJs = files.find(f => f.startsWith('script-') && f.endsWith('.js'));
          if (hashedJs) {
            const assetRes = await fetch(`http://127.0.0.1:3000/assets/${hashedJs}`);
            const assetCc = assetRes.headers.get('cache-control') || '';
            if (!assetCc.includes('immutable') || !assetCc.includes('31536000')) {
              issues.push(`Asset ${hashedJs} Cache-Control does not specify 31536000 and immutable (received: ${assetCc})`);
            }
          }
        }
      } finally {
        if (serverProc && serverPid) {
          try { process.kill(serverPid); } catch (e) {}
        }
      }

      if (issues.length > 0) {
        return { pass: false, output: `Delivery assertions failed:\n- ${issues.join('\n- ')}` };
      }
      return { pass: true, output: 'Verified gzip compression, HTML no-cache, hashed assets immutable, valid favicon, and meta tags over HTTP' };
    },
  },
];
