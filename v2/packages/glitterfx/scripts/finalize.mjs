// Copy the repository LICENSE into the package and fail if any published declaration still refers to a
// private workspace package (it would not resolve for users).
import { copyFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
copyFileSync(join(root, '../../../LICENSE'), join(root, 'LICENSE'));
for (const file of readdirSync(join(root, 'dist')).filter((f) => f.endsWith('.d.ts'))) {
  const text = readFileSync(join(root, 'dist', file), 'utf8');
  if (/from ['"]@glitterfx\//.test(text)) throw new Error(`dist/${file} references a private @glitterfx package`);
}
for (const dir of ['dist', 'dist/chunks', 'dist/cdn']) {
  for (const file of readdirSync(join(root, dir)).filter((f) => f.endsWith('.js'))) {
    const text = readFileSync(join(root, dir, file), 'utf8');
    if (/from ['"]@glitterfx\//.test(text)) throw new Error(`${dir}/${file} imports a private @glitterfx package`);
    // The CDN files must be fully self-contained: no bare imports at all.
    if (dir === 'dist/cdn' && /(?:from|import)\s*['"][^'"./]/.test(text)) throw new Error(`${dir}/${file} has a bare import`);
  }
}
console.log('glitterfx: package finalized (LICENSE copied, no private imports in dist).');
