/**
 * Wave: a sheet of particles displaced by travelling sine waves, brighter at crests.
 * Wave particles, aurora veil.
 */
import { clamp01, TAU, twinkle, wrap } from '../engine/behaviors.js';
import type { ParticleEffect } from '../engine/effect.js';
import { baseShape, budgetFrom, hazeFrom, WRAP_MARGIN, type ArchetypeBase } from './common.js';

export interface WaveParams extends ArchetypeBase {
  /** Vertical band the sheet occupies, as view-height fractions. */
  readonly band: readonly [number, number];
  /** Vertical displacement waves: [amplitude (heights), cycles per view width, omega (rad/s), phase]. */
  readonly waves: readonly (readonly [number, number, number, number])[];
  /** Horizontal folds: [amplitude (heights), cycles per band height, omega (rad/s)]. */
  readonly fold?: readonly [number, number, number];
  /** Brightness contrast between troughs and crests 0..1. */
  readonly crest?: number;
  /** Color by random pick, by crest height, or by position in the band (bottom -> top). */
  readonly colorBy?: 'random' | 'height' | 'band';
  /** Brightness falloff towards the top of the band 0..1. */
  readonly taper?: number;
  /** Horizontal drift (widths/s). */
  readonly flow?: number;
}

interface WaveFrame {
  width: number;
  ew: number;
  height: number;
  time: number;
}

export function createWaveEffect(p: WaveParams): ParticleEffect<WaveFrame> {
  const ampSum = p.waves.reduce((a, w) => a + w[0], 0) || 1;
  const [b0, b1] = p.band;
  const tw = p.twinkle ?? 0.2;
  const alpha = p.alpha ?? 1;

  return {
    id: p.id,
    defaultPalette: p.palette,
    budget: budgetFrom(p.counts),
    draws: 6,
    ...(p.trail ? { trail: p.trail } : {}),
    archetype: { kind: 'wave', params: p },

    generate(s, i, r, dust) {
      const [rx, ry, rz, rs, rc, rp] = r as unknown as number[];
      s.p.set([rx!, ry!, rz!], i * 3);
      baseShape(s, i, p, dust, rs!, rc!, 1);
      s.time.set([rp! * TAU, 1 + 3 * rz!, tw, 0], i * 4);
    },

    prepare(view, time) {
      return { width: view.width, ew: view.width + 2 * WRAP_MARGIN, height: view.height, time };
    },

    sample(s, i, f, out) {
      const o = i * 4;
      const d = s.p[i * 3 + 2]!;
      const by = s.p[i * 3 + 1]!;
      const px = wrap(s.p[i * 3]! * f.ew + (p.flow ?? 0) * f.width * f.time * (0.6 + 0.4 * d), f.ew) - WRAP_MARGIN;
      const u = px / f.width;
      let h = 0;
      for (const [amp, k, w, ph] of p.waves) h += amp * Math.sin(TAU * k * u + w * f.time + ph + d * 0.6);
      const hn = 0.5 + (0.5 * h) / ampSum;
      let x = px;
      if (p.fold) x += p.fold[0] * f.height * Math.sin(TAU * p.fold[1] * by + p.fold[2] * f.time + u * 3);
      out.x = x;
      out.y = (b0 + (b1 - b0) * by) * f.height + h * f.height * (0.6 + 0.4 * d);
      const crest = p.crest ?? 0;
      out.alpha =
        alpha * s.shape[o + 1]! * (0.4 + 0.6 * d) * (1 - crest + crest * hn) * (1 - (p.taper ?? 0) * (1 - by)) *
        twinkle(s.time[o]!, s.time[o + 1]!, s.time[o + 2]!, f.time);
      out.radius = s.shape[o]! * (0.5 + 0.7 * d);
      const last = s.palette.colors.length - 1;
      out.color = p.colorBy === 'height' ? clamp01(hn) * last : p.colorBy === 'band' ? (1 - by) * last : s.shape[o + 3]!;
      out.flare = 0;
      out.soft = 0;
      return true;
    },

    ...(p.haze ? { haze: hazeFrom(p.haze)! } : {}),
  };
}
