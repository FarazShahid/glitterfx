import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defaultClientConditions, defineConfig, type Plugin } from 'vite';

const v1Runtime = fileURLToPath(new URL('../../../glitterfx.js', import.meta.url));
const playgroundDir = fileURLToPath(new URL('./', import.meta.url));
const distDir = fileURLToPath(new URL('./dist/', import.meta.url));

/**
 * V2 is the default playground at index.html. The historical V1 Effect Lab is kept on-demand
 * at /v1.html. In dev we serve the V1 runtime from the repo root; in production we copy the
 * V1 lab assets and runtime into dist after the V2/parity/fixture pages have been built.
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
        copyFile(new URL('./v1.html', import.meta.url), new URL('./dist/v1.html', import.meta.url)),
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
      // V2 is the default homepage. v2.html remains as an explicit alias; V1 is copied separately.
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        v2: fileURLToPath(new URL('./v2.html', import.meta.url)),
        parity: fileURLToPath(new URL('./parity.html', import.meta.url)),
        fixtures: fileURLToPath(new URL('./fixtures.html', import.meta.url)),
      },
    },
  },
});
