// Pre-publish check for the one published package, `glitterfx` (after `npm run build`): it packs, carries
// every entry point with bundled types, ships no source maps of private paths into types, no tests,
// and does not depend on the private @glitterfx/* workspace libraries.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const dir = join(root, 'packages/glitterfx');
const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
const coreVersion = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8')).version;
const [report] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: dir, encoding: 'utf8' }));
const files = new Set(report.files.map((f) => f.path));
const fail = [];

if (manifest.private) fail.push('glitterfx is private');
if (manifest.version !== coreVersion) fail.push(`version ${manifest.version} != workspace ${coreVersion}`);
for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
  for (const dep of Object.keys(manifest[section] ?? {})) if (dep.startsWith('@glitterfx/')) fail.push(`${section} lists private ${dep}`);
}
for (const f of ['dist/index.js', 'dist/index.d.ts', 'dist/canvas.js', 'dist/canvas.d.ts', 'dist/react.js', 'dist/react.d.ts', 'dist/webgl.js', 'dist/webgl.d.ts', 'dist/cdn/glitterfx.js', 'dist/cdn/glitterfx.canvas.js', 'README.md', 'LICENSE']) {
  if (!files.has(f)) fail.push(`missing ${f} (run npm run build)`);
}
for (const f of files) if (/\.test\.|\/src\//.test(f)) fail.push(`ships ${f}`);
for (const name of ['@glitterfx/core', '@glitterfx/effects', '@glitterfx/backend-canvas', '@glitterfx/backend-webgl', '@glitterfx/react']) {
  const other = JSON.parse(readFileSync(join(root, 'packages', name.split('/')[1], 'package.json'), 'utf8'));
  if (!other.private) fail.push(`${name} must stay private (bundled into glitterfx)`);
}

console.log(`${manifest.name}@${manifest.version}: ${report.files.length} files, ${(report.size / 1024).toFixed(1)} kB packed, ${(report.unpackedSize / 1024).toFixed(0)} kB unpacked`);
if (fail.length) {
  for (const f of fail) console.error(`  FAIL ${f}`);
  process.exit(1);
}
console.log('Pack check PASS: glitterfx is ready to publish.');
