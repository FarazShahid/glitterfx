import { defaultClientConditions, defineConfig } from 'vite';

/** Self-contained minified ESM browser builds. Three.js is bundled into the full and legacy adapters. */
export default defineConfig({
  resolve: { conditions: ['@glitterfx/source', ...defaultClientConditions] },
  build: {
    outDir: 'dist/cdn',
    emptyOutDir: true,
    target: 'es2022',
    minify: true,
    lib: {
      entry: {
        glitterfx: 'src/cdn.ts',
        'glitterfx.canvas': 'src/cdn-canvas.ts',
        'glitterfx.legacy': 'src/legacy.ts',
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: { output: { chunkFileNames: '[name]-[hash].js' } },
  },
});
