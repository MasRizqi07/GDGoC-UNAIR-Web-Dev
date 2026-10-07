import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(rootDir, 'evidence', `verify-${timestamp}.log`);

const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function tee(data) {
  process.stdout.write(data);
  logStream.write(data);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    tee(`\n> Running: ${command} ${args.join(' ')}\n`);
    const child = spawn(command, args, {
      cwd: rootDir,
      shell: true,
      stdio: 'pipe',
    });

    child.stdout.on('data', tee);
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
      logStream.write(data);
    });

    child.on('close', (code) => {
      tee(`\n> Exited with code: ${code}\n`);
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

async function verify() {
  try {
    tee(`Starting verification at ${new Date().toISOString()}\n`);
    
    await runCommand('npm', ['test']); 
    
    tee(`\nVerification successful at ${new Date().toISOString()}\n`);
  } catch (err) {
    tee(`\nVerification FAILED: ${err.message}\n`);
    process.exit(1);
  } finally {
    logStream.end();
  }
}

verify();

