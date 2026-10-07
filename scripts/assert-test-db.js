const { execSync } = require('child_process');

module.exports = async function setupTestDB() {
  const dbUrl = process.env.TEST_DATABASE_URL || 'postgresql://dev:devpassword@localhost:5432/gdgoc_test?schema=public';
  if (!dbUrl.includes('_test')) {
    throw new Error(`Safety check failed: Test database URL must end with '_test' or contain '_test'. Got: ${dbUrl}`);
  }
  
  // Set DATABASE_URL so prisma commands run against the test db
  process.env.DATABASE_URL = dbUrl;
  console.log('Resetting test database...');
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit', env: process.env });
};

