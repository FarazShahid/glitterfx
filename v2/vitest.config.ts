import { defaultServerConditions } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Resolve workspace packages to TypeScript source so tests never need a prior build.
    conditions: ['@glitterfx/source', ...defaultServerConditions],
  },
  ssr: {
    resolve: {
      conditions: ['@glitterfx/source', ...defaultServerConditions],
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
  },
});
