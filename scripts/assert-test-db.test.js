const test = require('node:test');
const assert = require('node:assert');
const { validateTestDbUrl } = require('./assert-test-db.js');

test('Test DB URL Validation', async (t) => {
  await t.test('rejects .../gdgoc', () => {
    assert.throws(() => validateTestDbUrl('postgresql://dev:pw@127.0.0.1:5432/gdgoc'), /Test database name must end with '_test'/);
  });
  await t.test('accepts .../gdgoc_test', () => {
    assert.doesNotThrow(() => validateTestDbUrl('postgresql://dev:pw@127.0.0.1:5432/gdgoc_test'));
  });
  await t.test('rejects postgresql://dev_test:pw@localhost/gdgoc', () => {
    assert.throws(() => validateTestDbUrl('postgresql://dev_test:pw@localhost/gdgoc'), /Test database name must end with '_test'/);
  });
  await t.test('rejects .../gdgoc_test_backup', () => {
    assert.throws(() => validateTestDbUrl('postgresql://dev:pw@127.0.0.1:5432/gdgoc_test_backup'), /Test database name must end with '_test'/);
  });
  await t.test('accepts .../gdgoc_test?schema=public', () => {
    assert.doesNotThrow(() => validateTestDbUrl('postgresql://dev:pw@127.0.0.1:5432/gdgoc_test?schema=public'));
  });
  await t.test('rejects remote host without CI=true', () => {
    const origCI = process.env.CI;
    delete process.env.CI;
    assert.throws(() => validateTestDbUrl('postgresql://dev:pw@example.com:5432/gdgoc_test'), /Host must be local/);
    process.env.CI = origCI;
  });
  await t.test('accepts remote host with CI=true', () => {
    const origCI = process.env.CI;
    process.env.CI = 'true';
    assert.doesNotThrow(() => validateTestDbUrl('postgresql://dev:pw@example.com:5432/gdgoc_test'));
    process.env.CI = origCI;
  });
  await t.test('accepts localhost and 127.0.0.1', () => {
    assert.doesNotThrow(() => validateTestDbUrl('postgresql://dev:pw@localhost:5432/gdgoc_test'));
    assert.doesNotThrow(() => validateTestDbUrl('postgresql://dev:pw@127.0.0.1:5432/gdgoc_test'));
  });
});
