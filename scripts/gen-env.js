const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const examplePath = path.resolve(__dirname, '../.env.example');
const targetPath = path.resolve(__dirname, '../apps/api/.env');

if (fs.existsSync(targetPath)) {
  console.log('apps/api/.env already exists, skipping creation.');
  process.exit(0);
}

if (!fs.existsSync(examplePath)) {
  console.error('.env.example not found at', examplePath);
  process.exit(1);
}

let content = fs.readFileSync(examplePath, 'utf8');

// Replace JWT_SECRET placeholder with cryptographically secure random bytes
const secureSecret = crypto.randomBytes(48).toString('hex');
content = content.replace(/JWT_SECRET="[^"]*"/, `JWT_SECRET="${secureSecret}"`);

fs.writeFileSync(targetPath, content, { mode: 0o600 });
console.log('Generated apps/api/.env with secure random secrets.');
