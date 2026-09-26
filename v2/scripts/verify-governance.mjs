import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

const required = [
  'AGENTS.md',
  'CLAUDE.md',
  'v2/README.md',
  'v2/ARCHITECTURE.md',
  'v2/ROADMAP.md',
  'v2/BOT_PROTOCOL.md',
  'v2/VERIFICATION.md',
  'v2/COMPATIBILITY.md',
  'v2/PROJECT_STATE.md',
  'v2/package.json',
];

const protectedV1 = [
  'glitterfx.js',
  'glitterfx-demo.html',
  'glitterfx-docs.html',
  'README.md',
  'LICENSE',
];

function assertNoProtectedDiff(changed) {
  const violations = changed.filter((path) => protectedV1.includes(path));
  if (violations.length) {
    throw new Error(`Protected V1 files changed: ${violations.join(', ')}`);
  }
}

function selfTest() {
  assertNoProtectedDiff(['v2/README.md']);
  let caught = false;
  try {
    assertNoProtectedDiff(['README.md']);
  } catch {
    caught = true;
  }
  if (!caught) throw new Error('Self-test failed: protected-file mutation was not rejected.');
  console.log('Governance self-test PASS');
}

function findMainRef() {
  for (const ref of ['origin/main', 'main']) {
    try {
      execFileSync('git', ['rev-parse', '--verify', ref], { cwd: repoRoot, stdio: 'ignore' });
      return ref;
    } catch {
      // try next ref
    }
  }
  throw new Error('Cannot verify V1 isolation: neither origin/main nor main is available.');
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();

  const missing = required.filter((path) => !existsSync(resolve(repoRoot, path)));
  if (missing.length) throw new Error(`Missing V2 governance files: ${missing.join(', ')}`);

  const mainRef = findMainRef();
  const changed = execFileSync(
    'git',
    ['diff', '--name-only', mainRef, '--', ...protectedV1],
    { cwd: repoRoot, encoding: 'utf8' },
  ).trim().split(/\r?\n/).filter(Boolean);

  assertNoProtectedDiff(changed);
  console.log(`Governance PASS: V1 protected files unchanged vs ${mainRef}.`);
}

try {
  main();
} catch (error) {
  console.error(`Governance FAIL: ${error.message}`);
  process.exitCode = 1;
}
