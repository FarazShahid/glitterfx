import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Enforces the package dependency direction:
 *   effects -> core
 *   backend-canvas, backend-webgl -> effects, core
 *   playground -> everything
 * core depends on nothing; Three.js is only allowed in backend-webgl (and the app).
 */
const root = resolve(import.meta.dirname, '..');

const allowed: Record<string, string[]> = {
  core: [],
  effects: ['@glitterfx/core'],
  'backend-canvas': ['@glitterfx/core', '@glitterfx/effects'],
  'backend-webgl': ['@glitterfx/core', '@glitterfx/effects', 'three'],
  react: ['@glitterfx/core', 'react'],
  // The published package: bundles the private libraries; three and react are peers.
  glitterfx: ['@glitterfx/core', '@glitterfx/effects', '@glitterfx/backend-canvas', '@glitterfx/backend-webgl', '@glitterfx/react', 'three', 'react'],
};

type Manifest = Record<'dependencies' | 'peerDependencies', Record<string, string> | undefined>;

function declaredDeps(pkg: string): string[] {
  const manifest = JSON.parse(
    readFileSync(join(root, 'packages', pkg, 'package.json'), 'utf8'),
  ) as Manifest;
  return [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {})];
}

function importedModules(pkg: string): string[] {
  const dir = join(root, 'packages', pkg, 'src');
  const specifiers = new Set<string>();
  for (const file of readdirSync(dir, { recursive: true, encoding: 'utf8' })) {
    if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue;
    // Ignore comments: doc examples such as `import { GlitterFX } from 'glitterfx'` are not imports.
    const source = readFileSync(join(dir, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const match of source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
      const spec = match[1]!;
      if (spec.startsWith('.')) continue;
      // Reduce 'three/addons/x' or '@scope/pkg/x' to the package name.
      const parts = spec.split('/');
      specifiers.add(spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]!);
    }
  }
  return [...specifiers];
}

describe('package boundaries', () => {
  for (const [pkg, deps] of Object.entries(allowed)) {
    it(`${pkg} declares only allowed dependencies`, () => {
      expect(declaredDeps(pkg).filter((d) => !deps.includes(d))).toEqual([]);
    });

    it(`${pkg} source imports only allowed modules`, () => {
      expect(importedModules(pkg).filter((d) => !deps.includes(d))).toEqual([]);
    });
  }
});

describe('release metadata', () => {
  it('VERSION matches the package version', async () => {
    const { VERSION } = await import('@glitterfx/core');
    const manifest = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8')) as { version: string };
    expect(VERSION).toBe(manifest.version);
  });
});
