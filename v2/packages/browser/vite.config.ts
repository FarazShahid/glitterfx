import { defaultClientConditions, defineConfig } from 'vite';

// Self-contained ESM files for <script type="module"> / CDN use. Three.js is bundled into the full build.
export default defineConfig({
  resolve: { conditions: ['@glitterfx/source', ...defaultClientConditions] },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    minify: true,
    lib: {
      entry: { glitterfx: 'src/index.ts', 'glitterfx.canvas': 'src/canvas.ts' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
  },
});
