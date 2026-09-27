import { copyFileSync, createReadStream, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const here = import.meta.dirname;
const v2 = resolve(here, '../..');
const pkgRoot = resolve(v2, 'packages/glitterfx');
const pkg = JSON.parse(readFileSync(resolve(pkgRoot, 'package.json'), 'utf8'));
const source = resolve(pkgRoot, 'dist/cdn');
const out = resolve(here, 'dist');
const names = ['glitterfx.js', 'glitterfx.canvas.js'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const versionDir = resolve(out, 'v2', pkg.version);
const latestDir = resolve(out, 'v2', 'latest');
mkdirSync(versionDir, { recursive: true });
mkdirSync(latestDir, { recursive: true });

const files = {};
for (const name of names) {
  const input = resolve(source, name);
  copyFileSync(input, resolve(versionDir, name));
  copyFileSync(input, resolve(latestDir, name));
  const bytes = statSync(input).size;
  const digest = createHash('sha256').update(readFileSync(input)).digest();
  files[name] = {
    bytes,
    sha256: digest.toString('hex'),
    integrity: 'sha256-' + digest.toString('base64'),
    versioned: '/v2/' + pkg.version + '/' + name,
    latest: '/v2/latest/' + name,
  };
}

writeFileSync(
  resolve(out, 'manifest.json'),
  JSON.stringify({ package: pkg.name, version: pkg.version, files }, null, 2) + '\n',
);

const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const rows = Object.entries(files)
  .map(([name, info]) => '<tr><td>' + esc(name) + '</td><td>' + info.bytes.toLocaleString() + '</td><td><code>' + esc(info.versioned) + '</code></td></tr>')
  .join('');

writeFileSync(
  resolve(out, 'index.html'),
  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>GlitterFX CDN</title><style>body{font:16px/1.55 system-ui;margin:0;background:#05060a;color:#eef1f7}main{max-width:960px;margin:auto;padding:48px 24px}code{color:#c9ff66}table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #232735;text-align:left}a{color:#9fd7ff}</style></head>' +
    '<body><main><h1>GlitterFX V2 CDN</h1><p>Current version: <strong>' + esc(pkg.version) + '</strong></p>' +
    '<p>Use versioned URLs for production and <code>/v2/latest/</code> for demos or active development.</p>' +
    '<table><thead><tr><th>Bundle</th><th>Bytes</th><th>Versioned path</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<p><a href="/manifest.json">manifest.json</a></p></main></body></html>',
);

console.log('GlitterFX CDN staged:', pkg.version, files);
