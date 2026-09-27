import { defaultClientConditions, defineConfig } from 'vite';

/**
 * npm build: ESM entry points with the internal @glitterfx/* libraries inlined. Three.js and React stay
 * external (peer dependencies) so apps share one copy. Not minified: consumers bundle and minify.
 */
export default defineConfig({
  resolve: { conditions: ['@glitterfx/source', ...defaultClientConditions] },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    sourcemap: true,
    lib: {
      entry: { index: 'src/index.ts', canvas: 'src/canvas.ts', react: 'src/react.ts', webgl: 'src/webgl.ts' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: (id) => id === 'three' || id.startsWith('three/') || id === 'react' || id.startsWith('react/') || id.startsWith('react-dom'),
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
        // Next.js App Router: the React entry is a client component.
        banner: (chunk) => (chunk.isEntry && chunk.name === 'react' ? "'use client';" : ''),
      },
    },
  },
});
