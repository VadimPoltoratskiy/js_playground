// Minimal, dependency-free eval runner.
// Usage: node .claude/evals/run.js
//
// Reads every cases/*.json, imports the referenced export from src/,
// runs each case, and reports pass/fail. Exits non-zero on any failure.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const casesDir = join(here, 'cases');
const srcDir = join(here, '..', '..', 'src');

function fmt(v) {
  return typeof v === 'string' ? JSON.stringify(v) : String(v);
}

async function runFile(file) {
  const spec = JSON.parse(await readFile(join(casesDir, file), 'utf8'));
  const mod = await import(pathToFileURL(join(srcDir, spec.module)).href);
  const fn = mod[spec.export];

  if (typeof fn !== 'function') {
    throw new Error(`${spec.module} has no exported function "${spec.export}"`);
  }

  const results = [];
  for (const c of spec.cases) {
    try {
      if (c.throws) {
        assert.throws(() => fn(...c.args));
      } else {
        assert.deepEqual(fn(...c.args), c.expect);
      }
      results.push({ name: c.name, ok: true });
    } catch (err) {
      results.push({ name: c.name, ok: false, msg: err.message });
    }
  }
  return { module: spec.module, results };
}

const files = (await readdir(casesDir)).filter((f) => f.endsWith('.json'));
let passed = 0;
let failed = 0;

for (const file of files) {
  const { module, results } = await runFile(file);
  console.log(`\n${module}`);
  for (const r of results) {
    if (r.ok) {
      passed++;
      console.log(`  ✔ ${r.name}`);
    } else {
      failed++;
      console.log(`  ✗ ${r.name} — ${r.msg}`);
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
