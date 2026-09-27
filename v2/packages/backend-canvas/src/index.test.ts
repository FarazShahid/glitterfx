import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeConfig, type GlitterFXUpdate } from '@glitterfx/core';
import { canvasBackend } from './index.js';

afterEach(() => vi.unstubAllGlobals());

/** Records every draw call so frames can be compared exactly. */
function fakeDocument() {
  const calls: unknown[][] = [];
  const makeCtx = () => {
    const ctx = {
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: vi.fn(),
      drawImage: (_img: unknown, x: number, y: number, w: number, h: number) => calls.push([ctx.globalAlpha, x, y, w, h]),
    };
    return ctx;
  };
  const created: { width: number; height: number }[] = [];
  vi.stubGlobal('document', {
    createElement: () => {
      const ctx = makeCtx();
      const canvas = { width: 300, height: 150, getContext: () => ctx };
      created.push(canvas);
      return canvas;
    },
  });
  return { calls, created };
}

function run(updates: GlitterFXUpdate = {}, seed = 42) {
  const doc = fakeDocument();
  const config = normalizeConfig({ effect: 'star-field', seed, ...updates });
  const instance = canvasBackend.create(config);
  instance.resize({ width: 800, height: 450, pixelRatio: 1.5 });
  instance.frame({ time: 12.5, delta: 0.016 });
  return { ...doc, instance };
}

describe('canvasBackend', () => {
  it('reports unsupported without a DOM', () => {
    expect(canvasBackend.isSupported()).toBe(false);
  });

  it('sizes the backing store by pixel ratio and releases it on destroy', () => {
    const { created, instance } = run();
    const surface = created[0]!;
    expect([surface.width, surface.height]).toEqual([1200, 675]);
    instance.destroy();
    expect([surface.width, surface.height]).toEqual([0, 0]);
  });

  it('rejects effects it does not implement', () => {
    fakeDocument();
    expect(() => canvasBackend.create(normalizeConfig({ effect: 'nope' }))).toThrow(/"nope" is not implemented/);
  });
});

describe('canvas star-field', () => {
  it('draws the same frame for the same seed and time', () => {
    const a = run().calls;
    const b = run().calls;
    expect(a.length).toBeGreaterThan(500);
    expect(a).toEqual(b);
    expect(run({}, 43).calls).not.toEqual(a);
  });

  it('keeps star positions when only appearance changes', () => {
    const { calls, instance } = run();
    const positions = (list: unknown[][]) => list.map((c) => [(c[1] as number) + (c[3] as number) / 2, (c[2] as number) + (c[4] as number) / 2]);
    const before = positions(calls.splice(0));
    instance.update(normalizeConfig({ effect: 'star-field', seed: 42, glow: 0.9, size: 1.4 }));
    instance.frame({ time: 12.5, delta: 0 });
    const after = positions(calls);
    expect(after.length).toBe(before.length);
    after.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(before[i]![0]!, 6);
      expect(y).toBeCloseTo(before[i]![1]!, 6);
    });
  });

  it('scales star count with density', () => {
    const full = run({ density: 1 }).calls.length;
    const half = run({ density: 0.5 }).calls.length;
    expect(half / full).toBeGreaterThan(0.4);
    expect(half / full).toBeLessThan(0.6);
    expect(run({ density: 0 }).calls).toHaveLength(0);
  });
});

describe('engine refactor regression', () => {
  it('draws exactly the Step 2.4 star-field frame', () => {
    // Fingerprints captured from the pre-engine Canvas Star Field (quality high, 800x450, dpr 1).
    const cases = [
      { seed: 42, t: 12.5, glow: 0.5, size: 1, n: 1502, s: [685.811, 597790.164, 334727.914, 10229.649] },
      { seed: 7, t: 3, glow: 0.9, size: 1.6, n: 1503, s: [684.387, 592609.788, 317195.957, 23131.229] },
    ];
    for (const c of cases) {
      const { calls } = fakeDocument();
      const inst = canvasBackend.create(normalizeConfig({ effect: 'star-field', seed: c.seed, glow: c.glow, size: c.size, quality: 'high' }));
      inst.resize({ width: 800, height: 450, pixelRatio: 1 });
      inst.frame({ time: c.t, delta: 0 });
      const sums = [0, 0, 0, 0];
      for (const call of calls) for (let k = 0; k < 4; k++) sums[k]! += call[k] as number;
      expect(calls).toHaveLength(c.n);
      sums.forEach((v, k) => expect(v).toBeCloseTo(c.s[k]!, 1));
    }
  });
});

describe('canvas transitions', () => {
  it('dissolve and morph draw both effects and commit cleanly', () => {
    const { calls, instance } = run();
    calls.length = 0;
    const galaxy = normalizeConfig({ effect: 'galaxy', seed: 42 });
    for (const type of ['dissolve', 'morph'] as const) {
      expect(instance.beginTransition!(galaxy, type)).toBe(true);
      instance.setTransition!(0);
      instance.frame({ time: 1, delta: 0 });
      const atStart = calls.splice(0).length;
      instance.setTransition!(0.5);
      instance.frame({ time: 1, delta: 0 });
      const mid = calls.splice(0).length;
      expect(mid).toBeGreaterThan(atStart);
      instance.endTransition!(false);
    }
    instance.beginTransition!(galaxy, 'morph');
    instance.setTransition!(1);
    instance.endTransition!(true);
    instance.frame({ time: 1, delta: 0 });
    expect(calls.length).toBeGreaterThan(1000); // galaxy has 1800 particles at balanced
  });
});
