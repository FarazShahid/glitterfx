import { describe, expect, it } from 'vitest';
import { normalizeConfig, type GlitterFXUpdate } from '@glitterfx/core';
import { createRandom } from './random.js';
import { curlAdvect, dragDisplacement, forcedDisplacement, glintPulse, loopAge, turbulence } from './engine/behaviors.js';
import { applyMotion, applyPointer } from './engine/interaction.js';
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
    // Negative times: `motion.reverse` runs effect time backwards.
    for (const t of [0, 1.1, 3.3, 120, -7.7]) {
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

describe('glintPulse', () => {
  const sample = (phase: number, rate: number, t: number, sharpness = 32) => [...glintPulse(phase, rate, t, sharpness, [0, 0])];

  it('is repeatable and stays in [0, 1]', () => {
    for (let k = 0; k < 500; k++) {
      const [phase, rate, t] = [(k * 0.618) % 6.283, 0.5 + (k % 7) * 0.4, k * 0.37];
      const a = sample(phase, rate, t);
      expect(sample(phase, rate, t)).toEqual(a);
      for (const v of a) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('glints rarely, sharply and at irregular intervals', () => {
    const dt = 1 / 120;
    let bright = 0;
    const starts: number[] = [];
    let prev = 0;
    for (let i = 0; i < 120 * 600; i++) {
      const g = sample(1.3, 2.2, i * dt)[1]!;
      if (g > 0.5) bright++;
      if (g > 0.5 && prev <= 0.5) starts.push(i * dt);
      prev = g;
    }
    const share = bright / (120 * 600);
    expect(share).toBeGreaterThan(0.001); // it does glint
    expect(share).toBeLessThan(0.03); // but rarely
    // About one glint per 16 / rate seconds: 600 s at rate 2.2 -> roughly 80.
    expect(starts.length).toBeGreaterThan(50);
    expect(starts.length).toBeLessThan(120);
    const gaps = starts.slice(1).map((s, i) => s - starts[i]!);
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const spread = Math.sqrt(gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length);
    expect(spread / mean).toBeGreaterThan(0.15); // not a metronome
  });

  it('higher sharpness makes glints briefer; shimmer is independent of it', () => {
    const lit = (sharpness: number) => {
      let n = 0;
      for (let i = 0; i < 20000; i++) if (sample(0.7, 1.9, i * 0.01, sharpness)[1]! > 0.3) n++;
      return n;
    };
    expect(lit(64)).toBeLessThan(lit(12));
    expect(sample(0.7, 1.9, 3, 8)[0]).toBe(sample(0.7, 1.9, 3, 40)[0]);
  });
});

describe('applyPointer', () => {
  const at = (x: number, y: number) => ({ x, y, radius: 1, alpha: 1, color: 0, flare: 0, soft: 0 });
  const pointer = (mode: 1 | 2 | 3, strength = 1) => ({ mode, x: 100, y: 100, radius: 50, strength });

  it('repel pushes out, attract pulls in without overshooting, vortex keeps distance', () => {
    const r = at(120, 100);
    applyPointer(r, pointer(1));
    expect(r.x).toBeGreaterThan(120);
    expect(r.y).toBeCloseTo(100);
    const a = at(120, 100);
    applyPointer(a, pointer(2, 2));
    expect(a.x).toBeLessThan(120);
    expect(a.x).toBeGreaterThan(100);
    const v = at(120, 100);
    applyPointer(v, pointer(3));
    expect(Math.hypot(v.x - 100, v.y - 100)).toBeCloseTo(20);
    expect(v.y).not.toBeCloseTo(100);
    expect(r.alpha).toBeGreaterThan(1);
  });

  it('fades with distance and does nothing far away or at zero strength', () => {
    const near = at(110, 100);
    const far = at(200, 100);
    const beyond = at(260, 100);
    for (const s of [near, far, beyond]) applyPointer(s, pointer(1));
    expect(near.x - 110).toBeGreaterThan(far.x - 200);
    expect(beyond.x).toBe(260);
    const off = at(110, 100);
    applyPointer(off, pointer(1, 0));
    expect(off).toEqual(at(110, 100));
  });
});

describe('applyMotion', () => {
  const at = (x: number, y: number) => ({ x, y, radius: 1, alpha: 1, color: 0, flare: 0, soft: 0 });
  const W = 800;
  const H = 400;

  it('does nothing at zero offsets', () => {
    const s = at(123, 45);
    applyMotion(s, { x: 0, y: 0, z: 0 }, W, H, 0.5);
    expect(s).toEqual(at(123, 45));
  });

  it('x/y flow shifts and wraps on-view particles, leaves far-off ones unwrapped', () => {
    const s = at(700, 200);
    applyMotion(s, { x: 0.5, y: 0, z: 0 }, W, H, 0.5); // +200 px -> 900, wraps within [-40, 840]
    expect(s.x).toBeCloseTo(900 - (W + 80));
    const far = at(3000, 200);
    applyMotion(far, { x: 0.5, y: 0, z: 0 }, W, H, 0.5);
    expect(far.x).toBe(3200);
  });

  it('z flow is a perspective fly-through: direction kept, scale from 1 up, uniform coverage', () => {
    const s = at(500, 300);
    applyMotion(s, { x: 0, y: 0, z: 0.5 }, W, H, 0.1); // phase 0.6
    expect(Math.atan2(s.y - 200, s.x - 400)).toBeCloseTo(Math.atan2(100, 100));
    const scale = 1 / (1 - 0.85 * 0.6);
    expect(s.x).toBeCloseTo(400 + 100 * scale);
    expect(s.radius).toBeCloseTo(Math.sqrt(scale));
    // Periodic in z; faded at the start and end of each cycle.
    const again = at(500, 300);
    applyMotion(again, { x: 0, y: 0, z: 1.5 }, W, H, 0.1);
    expect(again.x).toBeCloseTo(s.x, 6);
    const born = at(500, 300);
    applyMotion(born, { x: 0, y: 0, z: 0.01 }, W, H, 0);
    expect(born.alpha).toBeLessThan(0.05);
    // A uniform field stays spread out (no collapse to the center): at any z, most particles stay
    // well away from it, like the static field.
    let near = 0;
    for (let i = 0; i < 2000; i++) {
      const p = at(((i * 0.618) % 1) * W, ((i * 0.7548) % 1) * H);
      applyMotion(p, { x: 0, y: 0, z: 0.9 }, W, H, (i * 0.37) % 1);
      if (Math.hypot(p.x - 400, p.y - 200) < 60) near++;
    }
    expect(near / 2000).toBeLessThan(0.05);
  });
});

describe('reverse time', () => {
  it('quantum hops stay continuous at negative times (odd/even parity matches GLSL mod)', () => {
    const effect = particleEffects['quantum-field']!;
    const s = generateParticles(effect, 'canvas', config('quantum-field'));
    const out: ParticleSample = { x: 0, y: 0, radius: 0, alpha: 0, color: 0, flare: 0, soft: 0 };
    const view = { width: 1000, height: 600 };
    for (let i = 0; i < 20; i++) {
      let prev: [number, number] | null = null;
      for (let t = -12; t < 0; t += 0.002) {
        effect.sample(s, i, effect.prepare(view, t, config('quantum-field')) as never, out);
        if (prev && Math.abs(out.x - prev[0]) < 500 && Math.abs(out.y - prev[1]) < 300) {
          // No teleports: movement per 2 ms step stays small (wraps excluded above).
          expect(Math.hypot(out.x - prev[0], out.y - prev[1])).toBeLessThan(25);
        }
        prev = [out.x, out.y];
      }
    }
  });
});
