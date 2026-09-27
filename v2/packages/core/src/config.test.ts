import { describe, expect, it } from 'vitest';
import { normalizeConfig } from './config.js';

describe('normalizeConfig', () => {
  it('fills defaults', () => {
    expect(normalizeConfig({ effect: 'star-field' })).toEqual({
      effect: 'star-field',
      renderer: 'auto',
      quality: 'balanced',
      density: 1,
      speed: 1,
      size: 1,
      brightness: 1,
      glow: 0.5,
      haze: 0,
      opacity: 1,
      params: {},
      interaction: { pointer: 'none', radius: 140, strength: 0.8 },
      motion: { x: 0, y: 0, z: 0, reverse: false },
      palette: undefined,
      seed: 1,
    });
  });

  it('clamps ranges, replaces non-finite numbers and coerces seed to uint32', () => {
    const c = normalizeConfig({ effect: 'x', density: 9, speed: -1, size: Number.NaN, glow: 2, seed: -1.7 });
    expect([c.density, c.speed, c.size, c.glow, c.seed]).toEqual([2, 0, 1, 1, 4294967295]);
  });

  it('rejects unknown renderer, quality and missing effect', () => {
    expect(() => normalizeConfig({ effect: 'x', renderer: 'webgpu' as never })).toThrow(/renderer "webgpu"/);
    expect(() => normalizeConfig({ effect: 'x', quality: 'ultra' as never })).toThrow(/quality "ultra"/);
    expect(() => normalizeConfig({ effect: '' })).toThrow(/effect/);
  });
});
