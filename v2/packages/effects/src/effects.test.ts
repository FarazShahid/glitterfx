import { describe, expect, it } from 'vitest';
import { normalizeConfig, type GlitterFXUpdate } from '@glitterfx/core';
import { createRandom } from './random.js';
import { curlAdvect, dragDisplacement, forcedDisplacement, loopAge, turbulence } from './engine/behaviors.js';
import { sphereEmitter } from './engine/emitters.js';
import { particleProfile } from './engine/appearance.js';
import { generateParticles, needsRegenerate, particleCounts, particleEffects, resolveParams, type ParticleSample } from './index.js';
import { ARM } from './galaxy.js';

const config = (effect: string, over: GlitterFXUpdate = {}) => normalizeConfig({ effect, seed: 42, ...over });

describe('createRandom', () => {
  it('is deterministic per seed and in [0, 1)', () => {
    const a = createRandom(7);
    const b = createRandom(7);
    const values = Array.from({ length: 1000 }, () => a());
    expect(values).toEqual(Array.from({ length: 1000 }, () => b()));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });
});

describe('star-field regression', () => {
  it('generates exactly the Step 2 field (pre-engine fingerprint)', () => {
    const s = generateParticles(particleEffects['star-field']!, 'canvas', config('star-field'));
    // Values captured from the Step 2.4 implementation before the engine refactor.
    expect(s.count).toBe(800);
    expect(Array.from(s.p.subarray(0, 4))).toEqual([0.6011037230491638, 0.44829055666923523, 0.7676932215690613, 0.47231706976890564]);
  });
});

describe.each(Object.keys(particleEffects))('%s', (id) => {
  const effect = particleEffects[id]!;

  it('reproduces the same particles for the same seed and differs for another', () => {
    const a = generateParticles(effect, 'canvas', config(id));
    expect(a).toEqual(generateParticles(effect, 'canvas', config(id)));
    // Seeds change the particles (positions may be index-determined, e.g. phyllotaxis).
    expect(generateParticles(effect, 'canvas', config(id, { seed: 43 }))).not.toEqual(a);
  });

  it('gives Canvas and WebGL the same primary particles', () => {
    const canvas = generateParticles(effect, 'canvas', config(id));
    const webgl = generateParticles(effect, 'webgl', config(id));
    expect(webgl.primaryCount).toBe(canvas.count);
    expect(webgl.count).toBeGreaterThan(canvas.count);
    expect(webgl.p.subarray(0, canvas.p.length)).toEqual(canvas.p);
    expect(webgl.shape.subarray(0, canvas.shape.length)).toEqual(canvas.shape);
    expect(webgl.time.subarray(0, canvas.time.length)).toEqual(canvas.time);
  });

  it('scales with quality and density', () => {
    expect(particleCounts(effect.budget, 'canvas', config(id, { quality: 'high' })).count).toBe(effect.budget.canvas.high);
    expect(particleCounts(effect.budget, 'webgl', config(id, { density: 0 })).count).toBe(0);
  });

  it('samples finite values inside a sensible range of the view', () => {
    const s = generateParticles(effect, 'canvas', config(id));
    const view = { width: 1000, height: 600 };
    const out: ParticleSample = { x: 0, y: 0, radius: 0, alpha: 0, color: 0, flare: 0, soft: 0 };
    let visible = 0;
    // Burst effects are legitimately empty between bursts, so require visibility over a spread of times.
    for (const t of [0, 1.1, 3.3, 120]) {
      const frame = effect.prepare(view, t, config(id));
      for (let i = 0; i < s.count; i++) {
        if (!effect.sample(s, i, frame as never, out)) continue;
        visible++;
        for (const v of [out.x, out.y, out.radius, out.alpha, out.color]) expect(Number.isFinite(v)).toBe(true);
        expect(out.x).toBeGreaterThan(-view.width);
        expect(out.x).toBeLessThan(view.width * 2);
        expect(out.color).toBeGreaterThanOrEqual(0);
        expect(out.color).toBeLessThanOrEqual(s.palette.colors.length - 1);
      }
    }
    expect(visible).toBeGreaterThan(0);
  });
});

describe('behaviors', () => {
  it('closed-form drag and forced motion match numeric integration', () => {
    let x = 0;
    let v = 3;
    let y = 0;
    let w = 0;
    const dt = 1e-4;
    for (let t = 0; t < 2; t += dt) {
      x += v * dt;
      v -= 1.5 * v * dt;
      y += w * dt;
      w += (4 - 1.5 * w) * dt;
    }
    expect(dragDisplacement(3, 1.5, 2)).toBeCloseTo(x, 3);
    expect(forcedDisplacement(4, 1.5, 2)).toBeCloseTo(y, 3);
  });

  it('loopAge stays in [0, life) and advances with time', () => {
    expect(loopAge(0, 1, 0, 2)).toBe(0);
    expect(loopAge(2.5, 1, 0, 2)).toBeCloseTo(0.5);
    expect(loopAge(-1, 1, 0, 2)).toBeCloseTo(1);
  });

  it('curl advection is continuous in age and deterministic', () => {
    const a = curlAdvect(0.2, 0.3, 1, 1.0, 0.1, 10, [0, 0]);
    const b = curlAdvect(0.2, 0.3, 1, 1.001, 0.1, 10, [0, 0]);
    expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(0.001);
    expect(curlAdvect(0.2, 0.3, 1, 1.0, 0.1, 10, [0, 0])).toEqual(a);
    const t = turbulence(0.1, 0.2, 3, [0, 0]);
    expect(Math.abs(t[0])).toBeLessThanOrEqual(0.875);
  });

  it('sphere emitter stays inside its radius', () => {
    const rnd = createRandom(1);
    for (let i = 0; i < 200; i++) expect(Math.hypot(...sphereEmitter(rnd(), rnd(), rnd(), 2))).toBeLessThanOrEqual(2 + 1e-9);
  });
});

describe('particleProfile', () => {
  it('peaks at the center, vanishes at the edge, spikes along axes', () => {
    expect(particleProfile(0, 0, 0.2, 0.5, false)[0]).toBeGreaterThan(particleProfile(0.5, 0, 0.2, 0.5, false)[0]);
    expect(particleProfile(1, 0, 0.2, 0.5, false)[0]).toBe(0);
    expect(particleProfile(0.6, 0, 0.07, 0.5, true)[0]).toBeGreaterThan(particleProfile(0.42, 0.42, 0.07, 0.5, true)[0] * 3);
  });
});

describe('effect params', () => {
  const galaxy = particleEffects['galaxy']!;

  it('resolves defaults, clamps and snaps to step', () => {
    expect(resolveParams(galaxy, config('galaxy'))).toEqual({ arms: 2, twist: 2.3 });
    expect(resolveParams(galaxy, config('galaxy', { params: { arms: 4.6, twist: 99, junk: 1 } }))).toEqual({ arms: 5, twist: 4 });
    expect(resolveParams(galaxy, config('galaxy', { params: { arms: -3 } }))['arms']).toBe(1);
    expect(resolveParams(particleEffects['star-field']!, config('star-field', { params: { arms: 4 } }))).toEqual({});
  });

  it('changing params regenerates, same values do not', () => {
    expect(needsRegenerate(config('galaxy', { params: { arms: 3 } }), config('galaxy', { params: { arms: 3 } }))).toBe(false);
    expect(needsRegenerate(config('galaxy', { params: { arms: 3 } }), config('galaxy', { params: { arms: 4 } }))).toBe(true);
  });

  it.each([1, 2, 3, 5, 8])('galaxy spreads arm stars over %i evenly spaced arms', (arms) => {
    const s = generateParticles(galaxy, 'webgl', config('galaxy', { params: { arms } }));
    // Unwind the log spiral at each arm star; the remaining angle clusters at k * 2pi / arms.
    const bins = new Array<number>(arms).fill(0);
    for (let i = 0; i < s.count; i++) {
      if (s.v[i * 4] !== ARM) continue;
      const r = s.p[i * 3]!;
      const unwound = s.p[i * 3 + 1]! - Math.log(r / 0.12) * 2.3;
      const slot = ((unwound / (2 * Math.PI)) * arms % arms + arms) % arms;
      bins[Math.floor(slot + 0.5) % arms]!++;
    }
    const mean = bins.reduce((a, b) => a + b, 0) / arms;
    for (const b of bins) expect(Math.abs(b - mean) / mean).toBeLessThan(0.1);
  });
});
