// Pre-publish check: every publishable package packs, contains its built entry points and
// type declarations, ships no tests, and pins internal dependencies to the workspace version.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const packages = ['core', 'effects', 'backend-canvas', 'backend-webgl', 'react', 'browser'];
const version = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8')).version;
let failed = false;
const fail = (msg) => {
  failed = true;
  console.error(`  FAIL ${msg}`);
};

for (const pkg of packages) {
  const dir = join(root, 'packages', pkg);
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const [report] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: dir, encoding: 'utf8' }));
  const files = new Set(report.files.map((f) => f.path));
  console.log(`${manifest.name}@${manifest.version}: ${report.files.length} files, ${(report.size / 1024).toFixed(1)} kB packed`);
  if (manifest.private) fail(`${pkg} is private`);
  if (manifest.version !== version) fail(`${pkg} version ${manifest.version} != ${version}`);
  for (const [dep, range] of Object.entries(manifest.dependencies ?? {})) {
    if (dep.startsWith('@glitterfx/') && range !== version) fail(`${pkg} depends on ${dep}@${range}`);
  }
  const entries = pkg === 'browser' ? ['dist/glitterfx.js', 'dist/glitterfx.canvas.js'] : ['dist/index.js', 'dist/index.d.ts'];
  for (const entry of entries) if (!files.has(entry)) fail(`${pkg} is missing ${entry} (run npm run build)`);
  for (const file of files) if (/\.test\.(t|j)s$/.test(file)) fail(`${pkg} ships test file ${file}`);
}
if (failed) process.exit(1);
console.log(`Pack check PASS: ${packages.length} packages at ${version}.`);
