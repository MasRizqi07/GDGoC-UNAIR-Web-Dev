import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'evidence', 'screenshots');

if (fs.existsSync(path.join(rootDir, 'apps/api/.env'))) {
  process.loadEnvFile(path.join(rootDir, 'apps/api/.env'));
} else if (fs.existsSync(path.join(rootDir, '.env'))) {
  process.loadEnvFile(path.join(rootDir, '.env'));
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { name: '320px', width: 320, height: 640 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1440px', width: 1440, height: 900 }
];

import { spawn } from 'node:child_process';

const themes = ['light', 'dark'];

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server failed to respond at ${url} within ${timeoutMs}ms`);
}

async function run() {
  console.log('Capturing Stage 8.3 screenshots into evidence/screenshots/...');

  let serverProc = null;
  let serverPid = null;

  let serverRunning = false;
  try {
    const res = await fetch('http://127.0.0.1:3000/api/v1/health');
    if (res.ok) serverRunning = true;
  } catch (e) {}

  if (!serverRunning) {
    console.log('Starting API server for screenshot capture...');
    serverProc = spawn(process.execPath, ['dist/main'], {
      cwd: path.join(rootDir, 'apps/api'),
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: '3000',
        DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://dev:devpassword@127.0.0.1:5432/gdgoc_test?schema=public',
      },
      detached: false,
    });
    serverPid = serverProc.pid;
    console.log(`Spawned server process PID: ${serverPid}`);
    await waitForServer('http://127.0.0.1:3000/api/v1/health');
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
  const capturedPaths = [];

  try {
    for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const theme of themes) {
      // 1. Home
      await page.goto(`${baseUrl}/`);
      await page.evaluate((th) => {
        document.body.classList.toggle('dark', th === 'dark');
      }, theme);
      await page.waitForTimeout(300);
      const homePath = path.join(outDir, `home-${vp.name}-${theme}.png`);
      await page.screenshot({ path: homePath, fullPage: false });
      capturedPaths.push(homePath);

      // 2. Tutorial
      await page.goto(`${baseUrl}/tutorials/widgets.html`);
      await page.evaluate((th) => {
        document.body.classList.toggle('dark', th === 'dark');
      }, theme);
      await page.waitForTimeout(300);
      const tutPath = path.join(outDir, `tutorial-${vp.name}-${theme}.png`);
      await page.screenshot({ path: tutPath, fullPage: false });
      capturedPaths.push(tutPath);

      // 3. Auth Form
      await page.goto(`${baseUrl}/`);
      await page.evaluate((th) => {
        document.body.classList.toggle('dark', th === 'dark');
      }, theme);
      await page.locator('#auth-button').click();
      await page.waitForSelector('#auth-modal:not([hidden])');
      await page.waitForTimeout(300);
      const authPath = path.join(outDir, `auth-form-${vp.name}-${theme}.png`);
      await page.screenshot({ path: authPath, fullPage: false });
      capturedPaths.push(authPath);

      // 4. Todo State
      await page.goto(`${baseUrl}/`);
      await page.evaluate((th) => {
        document.body.classList.toggle('dark', th === 'dark');
        localStorage.setItem('demo-todos-v1', JSON.stringify(['Inspect DOM state', 'Verify accessibility', 'Release to production']));
      }, theme);
      await page.reload();
      await page.evaluate((th) => {
        document.body.classList.toggle('dark', th === 'dark');
      }, theme);
      await page.getByRole('tab', { name: /Todo & state/ }).click();
      await page.waitForTimeout(300);
      const todoPath = path.join(outDir, `todo-state-${vp.name}-${theme}.png`);
      await page.screenshot({ path: todoPath, fullPage: false });
      capturedPaths.push(todoPath);
    }
  }
} finally {
    await browser.close();
    if (serverProc && serverPid) {
      console.log(`Stopping spawned server PID: ${serverPid}`);
      try {
        process.kill(serverPid);
      } catch (e) {}
    }
  }

  console.log(`Successfully captured ${capturedPaths.length} screenshots:`);
  for (const p of capturedPaths) {
    const rel = path.relative(rootDir, p).replace(/\\/g, '/');
    console.log(`- ${rel}`);
  }
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
