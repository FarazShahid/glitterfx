import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeConfig } from '@glitterfx/core';
import { generateParticles, particleEffects } from '@glitterfx/effects';
import type { BufferAttribute, Points } from 'three';
import { EFFECT_GLSL, glslFor } from './effects/index.js';
import { THREE_REVISION, webglBackend } from './index.js';
import { buildGeometry, buildMorphGeometry, createWebGLParticles, renameEffectGlsl } from './particles.js';

afterEach(() => vi.unstubAllGlobals());

const config = (effect: string, over: object = {}) => normalizeConfig({ effect, seed: 42, ...over });

describe('webglBackend', () => {
  it('resolves Three.js inside the WebGL package', () => {
    expect(Number(THREE_REVISION)).toBeGreaterThanOrEqual(180);
  });

  it('requires WebGL2 and releases the probe context', () => {
    const loseContext = vi.fn();
    vi.stubGlobal('document', {
      createElement: () => ({
        getContext: (kind: string) => (kind === 'webgl2' ? { getExtension: () => ({ loseContext }) } : null),
      }),
    });
    expect(webglBackend.isSupported()).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it('reports unsupported without a DOM and rejects unknown effects', () => {
    expect(webglBackend.isSupported()).toBe(false);
    expect(() => webglBackend.create(config('nope'))).toThrow(/"nope" is not implemented/);
  });

  it('has GLSL for every shared particle effect, including V1 aliases', () => {
    for (const [id, effect] of Object.entries(particleEffects)) expect(glslFor(effect), id).not.toBeNull();
  });
});

describe.each(Object.keys(particleEffects))('webgl %s', (id) => {
  it('uploads the shared store without copying, including the exact Canvas particles', () => {
    const canvas = generateParticles(particleEffects[id]!, 'canvas', config(id));
    const webgl = generateParticles(particleEffects[id]!, 'webgl', config(id));
    const trail = particleEffects[id]!.trail?.count ?? 1;
    const geometry = buildGeometry(webgl, trail);
    const position = geometry.getAttribute('position') as BufferAttribute;
    expect(position.count).toBe(webgl.count * trail);
    expect((geometry.getAttribute('aTrail') as BufferAttribute).getX(position.count - 1)).toBe(trail - 1);
    expect((position.array as Float32Array).subarray(0, canvas.p.length)).toEqual(canvas.p);
  });

  it('does no per-particle JS work per frame: only uniforms change', () => {
    const code = glslFor(particleEffects[id]!)!;
    const effect = createWebGLParticles(particleEffects[id]!, code.glsl, config(id), 1024, code.defines);
    const trail = particleEffects[id]!.trail?.count ?? 1;
    const points = effect.points;
    effect.resize(1280, 720, 1.5);
    const versions = () => Object.values(points.geometry.attributes).map((a) => (a as BufferAttribute).version);
    const geometry = points.geometry;
    const before = versions();
    for (let t = 0; t < 120; t++) effect.frame({ time: t / 60, delta: 1 / 60, motion: { x: t, y: 0, z: t }, direction: -1 });
    effect.update(config(id, { glow: 0.9, size: 2, brightness: 1.5 }));
    expect(points.geometry).toBe(geometry);
    expect(versions()).toEqual(before);
    effect.update(config(id, { seed: 7 }));
    expect(points.geometry).not.toBe(geometry);
    effect.dispose();
  });
});

describe('webgl morph', () => {
  it('renames effect inputs so two effects share one shader', () => {
    const renamed = renameEffectGlsl(EFFECT_GLSL['star-field']!, 'B');
    expect(renamed).toContain('bool sampleParticleB(');
    expect(renamed).toContain('positionB.z');
    expect(renamed).not.toMatch(/\bposition\b|\baShape\b|\baTime\b/);
  });

  it('renames every per-effect input in all effects, including palette size', () => {
    for (const effect of Object.values(particleEffects)) {
      const renamed = renameEffectGlsl(glslFor(effect)!.glsl, 'A');
      expect(renamed, effect.id).not.toMatch(/\bposition\b|\baV\b|\baShape\b|\baTime\b|\buPaletteSize\b/);
    }
  });

  it('pads both stores to the larger count and flags presence', () => {
    const a = generateParticles(particleEffects['star-field']!, 'webgl', config('star-field'));
    const b = generateParticles(particleEffects['galaxy']!, 'webgl', config('galaxy'));
    const g = buildMorphGeometry(a, b);
    const n = Math.max(a.count, b.count);
    expect(g.getAttribute('positionA').count).toBe(n);
    expect(g.getAttribute('positionB').count).toBe(n);
    const present = g.getAttribute('aPresent') as BufferAttribute;
    expect(present.getX(a.count - 1)).toBe(1);
    expect(present.getX(a.count)).toBe(0);
    expect(present.getY(n - 1)).toBe(1);
  });
});
