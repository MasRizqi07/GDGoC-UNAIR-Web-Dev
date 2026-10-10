import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const evidenceDir = path.join(rootDir, 'evidence');

if (fs.existsSync(path.join(rootDir, 'apps/api/.env'))) {
  process.loadEnvFile(path.join(rootDir, 'apps/api/.env'));
} else if (fs.existsSync(path.join(rootDir, '.env'))) {
  process.loadEnvFile(path.join(rootDir, '.env'));
}

if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server failed to respond at ${url} within ${timeoutMs}ms`);
}

async function run() {
  console.log('Running Stage 8.4 Lighthouse Audits...');
  let serverProc = null;
  let serverPid = null;

  // Check if port 3000 is open
  let serverRunning = false;
  try {
    const res = await fetch('http://127.0.0.1:3000/api/v1/health');
    if (res.ok) serverRunning = true;
  } catch (e) {}

  if (!serverRunning) {
    console.log('Starting API server for Lighthouse audit...');
    serverProc = spawn('node', ['dist/main'], {
      cwd: path.join(rootDir, 'apps/api'),
      stdio: 'ignore',
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
    console.log('API server ready.');
  } else {
    console.log('API server already running on port 3000.');
  }

  const auditsToRun = [
    { name: 'home-mobile', url: 'http://127.0.0.1:3000/', isDesktop: false },
    { name: 'home-desktop', url: 'http://127.0.0.1:3000/', isDesktop: true },
    { name: 'widgets-mobile', url: 'http://127.0.0.1:3000/tutorials/widgets.html', isDesktop: false },
    { name: 'widgets-desktop', url: 'http://127.0.0.1:3000/tutorials/widgets.html', isDesktop: true }
  ];

  const results = [];

  try {
    for (const item of auditsToRun) {
      const outFile = path.join(evidenceDir, `lighthouse-${item.name}.json`);
      console.log(`\nAuditing ${item.name} (${item.url})...`);
      
      const desktopFlag = item.isDesktop ? '--preset=desktop' : '';
      const cmd = `npx lighthouse ${item.url} --output=json --output-path="${outFile}" --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage" ${desktopFlag} --only-categories=accessibility,best-practices,performance,seo --quiet`;

      execSync(cmd, {
        cwd: rootDir,
        env: {
          ...process.env,
          CHROME_PATH: chromePath,
        },
        stdio: 'inherit',
      });

      const report = JSON.parse(fs.readFileSync(outFile, 'utf8'));
      const categories = report.categories || {};
      const audits = report.audits || {};

      const scores = {
        name: item.name,
        url: item.url,
        isDesktop: item.isDesktop,
        perf: Math.round((categories.performance?.score || 0) * 100),
        a11y: Math.round((categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100),
        lcpMs: audits['largest-contentful-paint']?.numericValue || 0,
        cls: audits['cumulative-layout-shift']?.numericValue || 0,
        jsTransferredBytes: audits['total-byte-weight']?.numericValue || 0,
        reportPath: `evidence/lighthouse-${item.name}.json`,
      };

      results.push(scores);
    }
  } finally {
    if (serverProc && serverPid) {
      console.log(`Stopping spawned server PID: ${serverPid}`);
      try {
        process.kill(serverPid);
      } catch (e) {}
    }
  }

  console.log('\n================================================================================');
  console.log('LIGHTHOUSE AUDIT RESULTS');
  console.log('================================================================================');
  console.log('| Page / Mode | Perf | A11y | Best Practices | SEO | LCP (s) | CLS | Report File |');
  console.log('|---|---|---|---|---|---|---|---|');

  let failedBudgets = [];

  for (const r of results) {
    const lcpSec = (r.lcpMs / 1000).toFixed(2);
    const clsVal = Number(r.cls).toFixed(3);
    console.log(`| ${r.name} | ${r.perf} | ${r.a11y} | ${r.bestPractices} | ${r.seo} | ${lcpSec}s | ${clsVal} | ${r.reportPath} |`);

    if (r.a11y < 95) failedBudgets.push(`${r.name}: Accessibility score ${r.a11y} < 95 budget`);
    if (r.bestPractices < 95) failedBudgets.push(`${r.name}: Best Practices score ${r.bestPractices} < 95 budget`);
    if (r.seo < 90) failedBudgets.push(`${r.name}: SEO score ${r.seo} < 90 budget`);
    if (!r.isDesktop && r.perf < 90) failedBudgets.push(`${r.name}: Mobile Performance score ${r.perf} < 90 budget`);
    if (r.lcpMs > 2500) failedBudgets.push(`${r.name}: LCP ${lcpSec}s > 2.5s budget`);
    if (r.cls > 0.1) failedBudgets.push(`${r.name}: CLS ${clsVal} > 0.1 budget`);
  }
  console.log('================================================================================');

  if (failedBudgets.length > 0) {
    console.error('Lighthouse budget failures:');
    for (const f of failedBudgets) console.error(`- ${f}`);
    process.exit(1);
  }

  console.log('All Lighthouse performance, accessibility, best-practices, and SEO budgets PASSED!');
}

run().catch((err) => {
  console.error('Lighthouse execution failed:', err);
  process.exit(1);
});

