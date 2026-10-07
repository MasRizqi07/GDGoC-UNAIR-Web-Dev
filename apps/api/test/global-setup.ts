import * as path from 'path';
import * as url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assertTestDb = require(path.join(__dirname, '../../../scripts/assert-test-db.js'));

export default async function setup() {
  await assertTestDb();
}
