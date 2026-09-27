/**
 * Fountain: ballistic launches from sources along the bottom edge, with drag and gravity.
 * Lava eruption, dancing waves.
 */
import { dragDisplacement, forcedDisplacement, lifeFade, loopAge, TAU, twinkle } from '../engine/behaviors.js';
import type { ParticleEffect } from '../engine/effect.js';
import { baseShape, budgetFrom, hazeFrom, type ArchetypeBase } from './common.js';

export interface FountainParams extends ArchetypeBase {
  readonly sources: number;
  /** Fraction of the width the sources span (centered). */
  readonly spread: number;
  /** Launch speed range (heights/s). */
  readonly speed: readonly [number, number];
  /** Max launch deviation from vertical (rad). */
  readonly angle: number;
  /** Heights/s^2. */
  readonly gravity: number;
  /** Linear drag (1/s), > 0. */
  readonly drag: number;
  readonly life: readonly [number, number];
  /** Per-source launch strength modulation over time 0..1. */
  readonly pulse?: number;
  readonly fade?: readonly [number, number];
  readonly grow?: number;
  readonly cool?: number;
}

interface FountainFrame {
  width: number;
  height: number;
  time: number;
}

export function createFountainEffect(p: FountainParams): ParticleEffect<FountainFrame> {
  const [fadeIn, fadeOut] = p.fade ?? [0.03, 0.45];
  const tw = p.twinkle ?? 0.25;
  const alpha = p.alpha ?? 1;
  const drag = Math.max(0.05, p.drag);

  return {
    id: p.id,
    defaultPalette: p.palette,
    budget: budgetFrom(p.counts),
    draws: 10,
    ...(p.trail ? { trail: p.trail } : {}),
    archetype: { kind: 'fountain', params: p },

    generate(s, i, r, dust) {
      const [rsrc, rv, ra, rl, rs, rc, rp, rx, rf, rq] = r as unknown as number[];
      const src = Math.min(p.sources - 1, Math.floor(rsrc! * p.sources));
      const sx = 0.5 + p.spread * ((src + 0.5) / p.sources - 0.5) + (rx! - 0.5) * 0.03;
      s.p.set([sx, p.speed[0] + (p.speed[1] - p.speed[0]) * rv!, (2 * ra! - 1) * p.angle], i * 3);
      s.v.set([p.life[0] + (p.life[1] - p.life[0]) * rl!, src], i * 4);
      baseShape(s, i, p, dust, rs!, rc!, rf!);
      s.time.set([rp!, 2 + 8 * rq!, tw, 0], i * 4);
    },

    prepare(view, time) {
      return { width: view.width, height: view.height, time };
    },

    sample(s, i, f, out) {
      const o = i * 4;
      const life = s.v[o]!;
      const age = loopAge(f.time, 1, s.time[o]!, life);
      const x = age / life;
      const spawn = f.time - age;
      const strength = 1 - (p.pulse ?? 0) * (0.5 + 0.5 * Math.sin(spawn * 0.9 + s.v[o + 1]! * 2.1));
      const v0 = s.p[i * 3 + 1]! * strength * f.height;
      const ang = s.p[i * 3 + 2]!;
      out.x = s.p[i * 3]! * f.width + dragDisplacement(Math.sin(ang) * v0, drag, age);
      out.y = f.height + 6 - dragDisplacement(Math.cos(ang) * v0, drag, age) + forcedDisplacement(p.gravity * f.height, drag, age);
      if (out.y > f.height + 30 && age > 0.2) return false;
      out.alpha = alpha * s.shape[o + 1]! * lifeFade(x, fadeIn, fadeOut) * twinkle(s.v[o + 3]! * TAU, s.time[o + 1]!, s.time[o + 2]!, f.time);
      out.radius = s.shape[o]! * (1 + (p.grow ?? 0) * x);
      out.color = Math.min(s.palette.colors.length - 1, s.shape[o + 3]! + (p.cool ?? 0) * x);
      out.flare = s.shape[o + 2]!;
      out.soft = 0;
      return true;
    },

    ...(p.haze ? { haze: hazeFrom(p.haze)! } : {}),
  };
}
