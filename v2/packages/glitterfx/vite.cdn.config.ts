import { defaultClientConditions, defineConfig } from 'vite';

/** CDN build: self-contained, minified ESM for <script type="module"> (Three.js bundled in the full file). */
export default defineConfig({
  resolve: { conditions: ['@glitterfx/source', ...defaultClientConditions] },
  build: {
    outDir: 'dist/cdn',
    emptyOutDir: true,
    target: 'es2022',
    minify: true,
    lib: {
      entry: { glitterfx: 'src/cdn.ts', 'glitterfx.canvas': 'src/cdn-canvas.ts' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: { output: { chunkFileNames: '[name]-[hash].js' } },
  },
});
