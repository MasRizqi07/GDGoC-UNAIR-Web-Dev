import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const ledgerDir = path.join(__dirname, 'ledger');

if (!fs.existsSync(ledgerDir)) {
  fs.mkdirSync(ledgerDir, { recursive: true });
}

export function findFiles(dir, filter) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        results = results.concat(findFiles(fullPath, filter));
      }
    } else if (filter(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

export function scanTestsAndAssertions() {
  const specFiles = [
    ...findFiles(path.join(rootDir, 'apps/api/test'), f => f.endsWith('.ts')),
    ...findFiles(path.join(rootDir, 'apps/web/e2e'), f => f.endsWith('.js')),
    ...findFiles(path.join(rootDir, 'scripts'), f => f.endsWith('.test.js')),
  ];

  const tests = {};
  const assertions = {};
  const forbiddenKeywords = [];

  for (const file of specFiles) {
    const rel = path.relative(rootDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');

    // Check for forbidden .skip, .todo, .fixme
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/\.(skip|todo|fixme)\s*\(/.test(line)) {
        forbiddenKeywords.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }

    // Count expect(
    const expectMatches = content.match(/\bexpect\s*\(/g) || [];
    assertions[rel] = expectMatches.length;

    // Extract test names
    const testMatches = [];
    const testRegex = /\b(?:it|test)(?:\.only)?\s*\(\s*(['"`])(.*?)\1/g;
    let match;
    while ((match = testRegex.exec(content)) !== null) {
      testMatches.push(match[2]);
    }
    tests[rel] = testMatches;
  }

  return { tests, assertions, forbiddenKeywords };
}

export function scanDependencies() {
  const pkgFiles = [
    'package.json',
    'apps/api/package.json',
    'apps/web/package.json',
    'packages/contracts/package.json',
  ];

  const deps = {};
  for (const pkgRel of pkgFiles) {
    const full = path.join(rootDir, pkgRel);
    if (!fs.existsSync(full)) continue;
    const json = JSON.parse(fs.readFileSync(full, 'utf8'));
    deps[pkgRel] = {
      dependencies: Object.keys(json.dependencies || {}).sort(),
      devDependencies: Object.keys(json.devDependencies || {}).sort(),
    };
  }

  return deps;
}

export function updateLedgers() {
  const { tests, assertions, forbiddenKeywords } = scanTestsAndAssertions();
  if (forbiddenKeywords.length > 0) {
    throw new Error(`Cannot update ledgers: forbidden test keywords found:\n${forbiddenKeywords.join('\n')}`);
  }

  const deps = scanDependencies();

  const testsPath = path.join(ledgerDir, 'tests.json');
  const assertionsPath = path.join(ledgerDir, 'assertions.json');
  const depsPath = path.join(ledgerDir, 'deps.json');

  // Grow existing tests ledger
  let mergedTests = tests;
  if (fs.existsSync(testsPath)) {
    const oldTests = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
    for (const [file, names] of Object.entries(oldTests)) {
      if (!mergedTests[file]) {
        mergedTests[file] = names;
      } else {
        const set = new Set([...names, ...mergedTests[file]]);
        mergedTests[file] = Array.from(set);
      }
    }
  }

  // Grow assertions
  let mergedAssertions = assertions;
  if (fs.existsSync(assertionsPath)) {
    const oldAssertions = JSON.parse(fs.readFileSync(assertionsPath, 'utf8'));
    for (const [file, count] of Object.entries(oldAssertions)) {
      if (mergedAssertions[file] === undefined || mergedAssertions[file] < count) {
        mergedAssertions[file] = count;
      }
    }
  }

  // Grow deps
  let mergedDeps = deps;
  if (fs.existsSync(depsPath)) {
    const oldDeps = JSON.parse(fs.readFileSync(depsPath, 'utf8'));
    for (const [pkg, categories] of Object.entries(oldDeps)) {
      if (!mergedDeps[pkg]) {
        mergedDeps[pkg] = categories;
      } else {
        mergedDeps[pkg].dependencies = Array.from(new Set([...categories.dependencies, ...mergedDeps[pkg].dependencies])).sort();
        mergedDeps[pkg].devDependencies = Array.from(new Set([...categories.devDependencies, ...mergedDeps[pkg].devDependencies])).sort();
      }
    }
  }

  fs.writeFileSync(testsPath, JSON.stringify(mergedTests, null, 2));
  fs.writeFileSync(assertionsPath, JSON.stringify(mergedAssertions, null, 2));
  fs.writeFileSync(depsPath, JSON.stringify(mergedDeps, null, 2));

  console.log('Ledgers updated successfully.');
}

export function verifyLedgers() {
  const { tests, assertions, forbiddenKeywords } = scanTestsAndAssertions();
  const errors = [];

  if (forbiddenKeywords.length > 0) {
    errors.push(`Forbidden test keywords (.skip/.todo/.fixme) found:\n${forbiddenKeywords.join('\n')}`);
  }

  const testsPath = path.join(ledgerDir, 'tests.json');
  const assertionsPath = path.join(ledgerDir, 'assertions.json');
  const depsPath = path.join(ledgerDir, 'deps.json');

  if (fs.existsSync(testsPath)) {
    const recordedTests = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
    for (const [file, recordedNames] of Object.entries(recordedTests)) {
      if (!tests[file]) {
        errors.push(`Missing test file recorded in ledger: ${file}`);
        continue;
      }
      const currentSet = new Set(tests[file]);
      for (const name of recordedNames) {
        if (!currentSet.has(name)) {
          errors.push(`Test disappeared from ${file}: "${name}"`);
        }
      }
    }
  }

  if (fs.existsSync(assertionsPath)) {
    const recordedAssertions = JSON.parse(fs.readFileSync(assertionsPath, 'utf8'));
    for (const [file, recordedCount] of Object.entries(recordedAssertions)) {
      const currentCount = assertions[file] || 0;
      if (currentCount < recordedCount) {
        errors.push(`Assertion count dropped in ${file}: expected at least ${recordedCount}, got ${currentCount}`);
      }
    }
  }

  if (fs.existsSync(depsPath)) {
    const recordedDeps = JSON.parse(fs.readFileSync(depsPath, 'utf8'));
    const currentDeps = scanDependencies();
    for (const [pkg, recordedCats] of Object.entries(recordedDeps)) {
      if (!currentDeps[pkg]) {
        errors.push(`Missing package.json recorded in ledger: ${pkg}`);
        continue;
      }
      for (const dep of recordedCats.dependencies) {
        if (!currentDeps[pkg].dependencies.includes(dep)) {
          errors.push(`Dependency removed from ${pkg}: ${dep}`);
        }
      }
      for (const devDep of recordedCats.devDependencies) {
        if (!currentDeps[pkg].devDependencies.includes(devDep)) {
          errors.push(`DevDependency removed from ${pkg}: ${devDep}`);
        }
      }
    }
  }

  // Check PROGRESS.md dependency ledger against current dependencies
  const progressContent = fs.readFileSync(path.join(rootDir, 'PROGRESS.md'), 'utf8');
  const currentDeps = scanDependencies();
  for (const [pkg, cats] of Object.entries(currentDeps)) {
    const all = [...cats.dependencies, ...cats.devDependencies];
    for (const dep of all) {
      if (!progressContent.includes(dep)) {
        errors.push(`Dependency "${dep}" in ${pkg} is not documented in PROGRESS.md dependency ledger`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
