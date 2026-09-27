// Finalize the single public package. V2 is the default engine; the exact V1 classic runtime is
// copied into dist/legacy for zero-break migration of old browser integrations.
import { copyFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
copyFileSync(join(root, '../../../LICENSE'), join(root, 'LICENSE'));

mkdirSync(join(root, 'dist/legacy'), { recursive: true });
copyFileSync(join(root, '../../../glitterfx.js'), join(root, 'dist/legacy/glitterfx.v1.js'));

for (const file of readdirSync(join(root, 'dist')).filter((f) => f.endsWith('.d.ts'))) {
  const text = readFileSync(join(root, 'dist', file), 'utf8');
  if (/from ['"]@glitterfx\//.test(text)) throw new Error(`dist/${file} references a private @glitterfx package`);
}
for (const dir of ['dist', 'dist/chunks', 'dist/cdn']) {
  for (const file of readdirSync(join(root, dir)).filter((f) => f.endsWith('.js'))) {
    const text = readFileSync(join(root, dir, file), 'utf8');
    if (/from ['"]@glitterfx\//.test(text)) throw new Error(`${dir}/${file} imports a private @glitterfx package`);
    if (dir === 'dist/cdn' && /(?:from|import)\s*['"][^'"./]/.test(text)) throw new Error(`${dir}/${file} has a bare import`);
  }
}

console.log('glitterfx: package finalized (V2 public entries + V1 compatibility/runtime).');
