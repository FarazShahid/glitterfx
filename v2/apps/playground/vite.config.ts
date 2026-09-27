import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defaultClientConditions, defineConfig, type Plugin } from 'vite';

const v1Runtime = fileURLToPath(new URL('../../../glitterfx.js', import.meta.url));
const playgroundDir = fileURLToPath(new URL('./', import.meta.url));
const distDir = fileURLToPath(new URL('./dist/', import.meta.url));

/**
 * The Effect Lab is intentionally a zero-build V1 reference UI. In dev we serve the historical
 * runtime from the repo root. In production we copy the Effect Lab and runtime into dist after the
 * V2/parity/fixture pages have been built, making index.html the deployable site homepage.
 */
function effectLabAssets(): Plugin {
  return {
    name: 'glitterfx:effect-lab-assets',

    configureServer(server) {
      server.middlewares.use('/glitterfx.js', (_req, res) => {
        void readFile(v1Runtime).then((source) => {
          res.setHeader('Content-Type', 'text/javascript');
          res.end(source);
        });
      });
    },

    async closeBundle() {
      await mkdir(distDir, { recursive: true });
      await Promise.all([
        copyFile(new URL('./index.html', import.meta.url), new URL('./dist/index.html', import.meta.url)),
        copyFile(new URL('./app.js', import.meta.url), new URL('./dist/app.js', import.meta.url)),
        copyFile(new URL('./styles.css', import.meta.url), new URL('./dist/styles.css', import.meta.url)),
        copyFile(v1Runtime, new URL('./dist/glitterfx.js', import.meta.url)),
      ]);
    },
  };
}

export default defineConfig({
  resolve: {
    conditions: ['@glitterfx/source', ...defaultClientConditions],
  },
  plugins: [effectLabAssets()],
  build: {
    target: 'es2022',
    rollupOptions: {
      // V2 diagnostic pages are bundled. The full Effect Lab is copied as a static production homepage.
      input: {
        v2: fileURLToPath(new URL('./v2.html', import.meta.url)),
        parity: fileURLToPath(new URL('./parity.html', import.meta.url)),
        fixtures: fileURLToPath(new URL('./fixtures.html', import.meta.url)),
      },
    },
  },
});
