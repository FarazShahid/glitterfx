/**
 * Curl: particles advected through a divergence-free field, re-integrated from spawn each frame.
 * Curl flow, plasma storm.
 */
import { curlAdvect, lifeFade, loopAge, TAU, twinkle, wrap } from '../engine/behaviors.js';
import type { ParticleEffect } from '../engine/effect.js';
import { baseShape, budgetFrom, hazeFrom, type ArchetypeBase } from './common.js';

export interface CurlParams extends ArchetypeBase {
  /** Integration steps (GLSL CURL_STEPS). */
  readonly steps: number;
  /** Field units per second. */
  readonly speed: number;
  /** Field evolution rate relative to effect time. */
  readonly evolve: number;
  /** Viewport fraction (of the larger side) per field unit. */
  readonly unit: number;
  /** Wrap margin in CSS px. */
  readonly margin: number;
  /** Lifetime range (s). */
  readonly life: readonly [number, number];
  /** Color bands follow spawn position instead of a weighted pick. */
  readonly bands?: boolean;
}

interface CurlFrame {
  width: number;
  height: number;
  ref: number;
  time: number;
  out: [number, number];
}

export function createCurlEffect(p: CurlParams): ParticleEffect<CurlFrame> {
  const alpha = p.alpha ?? 1;
  const tw = p.twinkle ?? 0;
  return {
    id: p.id,
    defaultPalette: p.palette,
    budget: budgetFrom(p.counts),
    draws: 7,
    ...(p.trail ? { trail: p.trail } : {}),
    archetype: { kind: 'curl', params: p },

    generate(s, i, r, dust) {
      const [rx, ry, rz, rp, rl, rs, rc] = r as unknown as number[];
      const depth = 0.3 + 0.7 * rz!;
      s.p.set([rx!, ry!, depth], i * 3);
      baseShape(s, i, p, dust, rs!, rc!, p.flareChance ? rl! * 7 % 1 : 1);
      // Scale size by depth; optionally color by spawn position so streams keep coherent bands.
      s.shape[i * 4] = s.shape[i * 4]! * (0.6 + 0.6 * depth);
      if (p.bands) {
        const last = s.palette.colors.length - 1;
        s.shape[i * 4 + 3] = Math.min(last, (rx! * 0.6 + ry! * 0.4) * last + rc! * 0.6);
      }
      s.time.set([rp!, 3 + 9 * rl!, tw, p.life[0] + (p.life[1] - p.life[0]) * rl!], i * 4);
    },

    prepare(view, time) {
      return { width: view.width, height: view.height, ref: Math.max(view.width, view.height) * p.unit, time, out: [0, 0] };
    },

    sample(s, i, f, out) {
      const o = i * 4;
      const life = s.time[o + 3]!;
      const age = loopAge(f.time, 1, s.time[o]!, life);
      const spawn = f.time - age;
      curlAdvect((s.p[i * 3]! * f.width) / f.ref, (s.p[i * 3 + 1]! * f.height) / f.ref, spawn * p.evolve, age, p.speed, p.steps, f.out);
      const m = p.margin;
      out.x = wrap(f.out[0] * f.ref + m, f.width + 2 * m) - m;
      out.y = wrap(f.out[1] * f.ref + m, f.height + 2 * m) - m;
      out.radius = s.shape[o]!;
      out.alpha = alpha * s.shape[o + 1]! * lifeFade(age / life, 0.15, 0.35) * (0.45 + 0.55 * s.p[i * 3 + 2]!) *
        twinkle(s.v[o + 3]! * TAU, s.time[o + 1]!, s.time[o + 2]!, f.time);
      out.color = s.shape[o + 3]!;
      out.flare = s.shape[o + 2]!;
      out.soft = 0;
      return true;
    },

    ...(p.haze ? { haze: hazeFrom(p.haze)! } : {}),
  };
}
