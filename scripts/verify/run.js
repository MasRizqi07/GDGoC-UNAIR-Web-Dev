import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { updateLedgers } from './ledger.js';
import { stageSGates } from './gates/stage-s.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const evidenceDir = path.join(rootDir, 'evidence');

if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: rootDir, encoding: 'utf8', stdio: 'pipe', ...opts });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--update-ledger')) {
    console.log('Updating ledgers...');
    updateLedgers();
    process.exit(0);
  }

  let stage = null;
  const stageIdx = args.indexOf('--stage');
  if (stageIdx !== -1 && args[stageIdx + 1]) {
    stage = args[stageIdx + 1].toUpperCase();
  }

  const isAll = args.includes('--all');
  const isFreshClone = args.includes('--fresh-clone');
  const shouldTag = args.includes('--tag');

  if (!stage && !isAll && !isFreshClone) {
    console.error('Usage: node scripts/verify/run.js --stage <id> | --all | --fresh-clone [--tag] [--update-ledger]');
    process.exit(1);
  }

  // Setup logging
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const stageTag = stage || (isAll ? 'ALL' : 'FRESH-CLONE');
  const logFileName = `${stageTag}-${timestamp}.log`;
  const logFilePath = path.join(evidenceDir, logFileName);
  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

  function tee(str) {
    process.stdout.write(str);
    logStream.write(str);
  }

  tee(`================================================================================\n`);
  tee(`VERIFIER EXECUTION: STAGE ${stageTag}\n`);
  tee(`Timestamp: ${new Date().toISOString()}\n`);
  tee(`Node Version: ${process.version}\n`);

  let headSha = 'UNKNOWN';
  try {
    headSha = run('git rev-parse HEAD').trim();
  } catch (e) {
    headSha = 'GIT ERROR';
  }
  tee(`HEAD SHA: ${headSha}\n`);
  tee(`================================================================================\n\n`);

  // Clean tree check at start
  const status = run('git status --porcelain').trim();
  if (status) {
    tee(`ERROR: Working tree is not clean at start of verification run:\n${status}\n`);
    logStream.end();
    process.exit(1);
  }

  let gates = [];
  if (stage === 'S') {
    gates = stageSGates;
  } else if (stage === 'R') {
    const { stageRGates } = await import('./gates/stage-r.js');
    gates = stageRGates;
  } else if (stage === '7') {
    const { stage7Gates } = await import('./gates/stage-7.js');
    gates = stage7Gates;
  } else if (stage === '8') {
    const { stage8Gates } = await import('./gates/stage-8.js');
    gates = stage8Gates;
  } else if (isAll) {
    gates = stageSGates; // Will chain through all stages as implemented
  } else {
    tee(`Stage ${stage} not yet implemented or unknown.\n`);
    logStream.end();
    process.exit(1);
  }

  const results = [];
  let allPassed = true;

  for (const gate of gates) {
    tee(`\n--------------------------------------------------------------------------------\n`);
    tee(`[RUNNING GATE] ${gate.id}: ${gate.title}\n`);
    tee(`--------------------------------------------------------------------------------\n`);
    const startTime = Date.now();
    try {
      const res = await gate.run();
      const durationMs = Date.now() - startTime;
      if (res.output) tee(`${res.output}\n`);
      results.push({
        id: gate.id,
        title: gate.title,
        pass: res.pass,
        durationMs,
      });
      if (!res.pass) {
        allPassed = false;
        tee(`>> GATE FAILED: ${gate.id}\n`);
      } else {
        tee(`>> GATE PASSED: ${gate.id} (${durationMs}ms)\n`);
      }
    } catch (err) {
      const durationMs = Date.now() - startTime;
      tee(`GATE EXCEPTION: ${err.message}\n${err.stack || ''}\n`);
      results.push({
        id: gate.id,
        title: gate.title,
        pass: false,
        durationMs,
      });
      allPassed = false;
      tee(`>> GATE FAILED WITH EXCEPTION: ${gate.id}\n`);
    }
  }

  // Generate PASS/FAIL table
  tee(`\n================================================================================\n`);
  tee(`VERIFICATION SUMMARY TABLE: STAGE ${stageTag}\n`);
  tee(`================================================================================\n`);
  tee(`| Gate ID | Title | Status | Duration |\n`);
  tee(`|---|---|---|---|\n`);
  for (const r of results) {
    tee(`| ${r.id} | ${r.title} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.durationMs}ms |\n`);
  }
  tee(`================================================================================\n`);

  logStream.end();
  await new Promise(res => setTimeout(res, 500));

  // Compute log file sha256
  const logContent = fs.readFileSync(logFilePath);
  const sha256 = crypto.createHash('sha256').update(logContent).digest('hex');

  console.log(`\nEvidence Log: evidence/${logFileName}`);
  console.log(`Log SHA256: ${sha256}`);
  console.log(`Overall Result: ${allPassed ? 'PASS' : 'FAIL'}`);

  if (allPassed && shouldTag) {
    const tagName = `checkpoint/stage-${stage.toLowerCase()}`;
    console.log(`Creating verification tag: ${tagName}`);
    run(`git tag ${tagName}`);
  }

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal verifier error:', err);
  process.exit(1);
});
