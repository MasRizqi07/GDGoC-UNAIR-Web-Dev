const { execSync } = require('child_process');

function validateTestDbUrl(dbUrl) {
  if (!dbUrl) throw new Error("Safety check failed: No URL provided");
  
  const parsed = new URL(dbUrl);
  const dbName = parsed.pathname.slice(1); // remove leading slash
  
  // Extract base database name without query params
  const actualDbName = dbName.split('?')[0];

  if (!actualDbName.endsWith('_test')) {
    throw new Error(`Safety check failed: Test database name must end with '_test'. Got: ${actualDbName}`);
  }

  // Require it to differ from the dev database name. 
  // In our case, the name literally must end with _test so it differs from 'gdgoc' naturally.

  const allowedHosts = ['localhost', '127.0.0.1', 'db'];
  if (!process.env.CI && !allowedHosts.includes(parsed.hostname)) {
    throw new Error(`Safety check failed: Host must be local (localhost, 127.0.0.1, db) unless CI=true. Got: ${parsed.hostname}`);
  }
}

module.exports = async function setupTestDB() {
  const dbUrl = process.env.TEST_DATABASE_URL || 'postgresql://dev:devpassword@localhost:5432/gdgoc_test?schema=public';
  validateTestDbUrl(dbUrl);
  
  // Set DATABASE_URL so prisma commands run against the test db
  process.env.DATABASE_URL = dbUrl;
  console.log('Resetting test database...');
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit', env: process.env });
};

module.exports.validateTestDbUrl = validateTestDbUrl;
