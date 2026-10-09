const { execSync } = require('node:child_process');

const commits = ['ee25698', '45fad98', 'd22d16c', '5c70798', '2646ad4', 'b2ca95f'];

console.log('=== PROVENANCE AUDIT (S8) ===');

for (const sha of commits) {
  console.log(`\n--- Commit: ${sha} ---`);
  const diff = execSync(`git show ${sha}`, { encoding: 'utf8' });
  const lines = diff.split('\n');

  let removedExpect = 0;
  let addedExpect = 0;
  let skipMatches = [];
  let timeoutMatches = [];
  let retryMatches = [];

  for (const line of lines) {
    if (line.startsWith('---') || line.startsWith('+++')) continue;
    if (line.startsWith('-') && line.includes('expect(')) removedExpect++;
    if (line.startsWith('+') && line.includes('expect(')) addedExpect++;
    if (line.startsWith('+') && /\.(skip|todo|fixme)\b/.test(line)) skipMatches.push(line);
    if (line.startsWith('+') && /timeout/i.test(line)) timeoutMatches.push(line);
    if (line.startsWith('+') && /retries/i.test(line)) retryMatches.push(line);
  }

  console.log(`  Expect changes: -${removedExpect} / +${addedExpect}`);
  console.log(`  New .skip/.todo/.fixme:`, skipMatches.length ? skipMatches : 'None');
  console.log(`  New timeouts:`, timeoutMatches.length ? timeoutMatches : 'None');
  console.log(`  New retries:`, retryMatches.length ? retryMatches : 'None');
}
