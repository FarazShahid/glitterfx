import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defaultClientConditions, defineConfig, type Plugin } from 'vite';

const v1Runtime = fileURLToPath(new URL('../../../glitterfx.js', import.meta.url));

/**
 * The zero-build Effect Lab (index.html) loads the V1 runtime from the repo root.
 * In dev, serve that file read-only so both the Lab and the V2 page run from one server.
 */
function serveV1Runtime(): Plugin {
  return {
    name: 'glitterfx:serve-v1-runtime',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/glitterfx.js', (_req, res) => {
        void readFile(v1Runtime).then((source) => {
          res.setHeader('Content-Type', 'text/javascript');
          res.end(source);
        });
      });
    },
  };
}

export default defineConfig({
  resolve: {
    // Workspace packages resolve to TypeScript source: no package build needed for dev.
    conditions: ['@glitterfx/source', ...defaultClientConditions],
  },
  plugins: [serveV1Runtime()],
  build: {
    target: 'es2022',
    rollupOptions: {
      // The Effect Lab is zero-build static; only the V2 page is bundled.
      input: {
        v2: fileURLToPath(new URL('./v2.html', import.meta.url)),
        parity: fileURLToPath(new URL('./parity.html', import.meta.url)),
        fixtures: fileURLToPath(new URL('./fixtures.html', import.meta.url)),
      },
    },
  },
});
