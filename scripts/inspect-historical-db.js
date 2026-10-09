const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const commits = ['e20c34b', '1b4a4da', 'f0e434b', 'f03dd54'];
const tempDbPath = path.join(__dirname, 'temp_inspect.db');

console.log('=== HISTORICAL DB INSPECTION (S3) ===');

for (const commit of commits) {
  console.log(`\nCommit: ${commit}`);
  try {
    const blobBuffer = execFileSync('git', ['cat-file', 'blob', `${commit}:apps/api/prisma/dev.db`]);
    fs.writeFileSync(tempDbPath, blobBuffer);

    const db = new DatabaseSync(tempDbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);
    console.log(`Tables: [${tables.join(', ')}]`);

    let nonExampleDomainFound = false;
    let totalRefreshTokens = 0;

    for (const table of tables) {
      const countRes = db.prepare(`SELECT count(*) as count FROM "${table}"`).get();
      console.log(`  Table "${table}" row count: ${countRes.count}`);

      if (table.toLowerCase() === 'user') {
        const users = db.prepare('SELECT email FROM "User"').all();
        const domainCounts = {};
        for (const u of users) {
          const emailStr = String(u.email || '');
          const parts = emailStr.split('@');
          const domain = parts.length > 1 ? parts[1].toLowerCase() : 'unknown';
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
          if (domain !== 'example.com' && domain !== 'example.test' && domain !== 'localhost') {
            nonExampleDomainFound = true;
          }
        }
        console.log(`  User counts per email domain:`, domainCounts);
      }

      if (table.toLowerCase() === 'refreshtoken') {
        const tokens = db.prepare('SELECT count(*) as count FROM "RefreshToken"').get();
        totalRefreshTokens = tokens.count;
      }
    }

    console.log(`  Total refresh tokens: ${totalRefreshTokens}`);
    console.log(`  Non-example domain exists: ${nonExampleDomainFound}`);
    db.close();
  } catch (err) {
    console.error(`  Error inspecting ${commit}:`, err.message);
  } finally {
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
  }
}
