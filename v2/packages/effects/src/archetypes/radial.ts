/**
 * Radial: particles emitted from the center (continuous stream or synchronized bursts/beats)
 * along spiral paths, or orbiting it. Ray burst, bending chaos, petal burst, heartbeat, spiral drift,
 * emerald shimmer, cosmic dust.
 */
import { lifeFade, loopAge, TAU, twinkle, wrap } from '../engine/behaviors.js';
import type { ParticleEffect } from '../engine/effect.js';
import { baseShape, budgetFrom, hazeFrom, type ArchetypeBase } from './common.js';

export type RadialCurve = 'linear' | 'sqrt' | 'ease' | 'accel';

export interface RadialParams extends ArchetypeBase {
  readonly emission: 'stream' | 'sync' | 'orbit';
  /** sync: seconds per cycle. */
  readonly period?: number;
  /** sync: emission offsets within a cycle (e.g. a double heartbeat). Default [0]. */
  readonly beats?: readonly number[];
  /** Lifetime range (s). */
  readonly life: readonly [number, number];
  /** Radius at end of life as a fraction of half the smaller side. */
  readonly reach: number;
  /** 0 = every particle on the same shell, 1 = full spread. */
  readonly reachJitter: number;
  readonly curve: RadialCurve;
  /** Angular velocity (rad/s). Orbit: at radius ~0.7. */
  readonly spin?: number;
  /** Share of particles spinning the other way. */
  readonly counterShare?: number;
  /** Extra angle per unit of travelled reach (spiral arms). */
  readonly twist?: number;
  /** Phyllotaxis start angles (golden angle per index). */
  readonly golden?: boolean;
  /** Vertical scale (tilted disk). Default 1. */
  readonly squash?: number;
  /** Orbit only: normalized radial band [inner, outer]. Default [0.02, 1]. */
  readonly orbitBand?: readonly [number, number];
  /** Rotate the projected/squashed disk in screen space (radians). Default 0. */
  readonly rotation?: number;
  /** Orbit only: map palette position from inner to outer radius instead of random color. */
  readonly colorByRadius?: boolean;
  /** Fade in/out fractions of life. Default [0.05, 0.4]. */
  readonly fade?: readonly [number, number];
  /** Size added over life (1 = doubles). */
  readonly grow?: number;
  /** Palette positions added over life. */
  readonly cool?: number;
  /** sync: extra brightness at birth. */
  readonly flash?: number;
}

interface RadialFrame {
  cx: number;
  cy: number;
  scale: number;
  time: number;
}

const GOLDEN_ANGLE = 2.399963229728653;

/** Mirrored in GLSL. */
export function radialCurve(curve: RadialCurve, x: number): number {
  switch (curve) {
    case 'sqrt':
      return Math.sqrt(x);
    case 'ease':
      return 1 - (1 - x) * (1 - x);
    case 'accel':
      return x * x;
    default:
      return x;
  }
}

export function createRadialEffect(p: RadialParams): ParticleEffect<RadialFrame> {
  const beats = p.beats ?? [0];
  const [fadeIn, fadeOut] = p.fade ?? [0.05, 0.4];
  const tw = p.twinkle ?? 0.2;
  const alpha = p.alpha ?? 1;
  const squash = p.squash ?? 1;
  const spin = p.spin ?? 0;
  const twist = p.twist ?? 0;
  const [orbitMin, orbitMax] = p.orbitBand ?? [0.02, 1];
  const rotation = p.rotation ?? 0;
  const cosRotation = Math.cos(rotation);
  const sinRotation = Math.sin(rotation);

  return {
    id: p.id,
    defaultPalette: p.palette,
    budget: budgetFrom(p.counts),
    draws: 10,
    ...(p.trail ? { trail: p.trail } : {}),
    archetype: { kind: 'radial', params: p },

    generate(s, i, r, dust) {
      const [ra, rr, rl, rs, rc, rp, rb, rd, rq, rf] = r as unknown as number[];
      const a0 = p.golden ? wrap(i * GOLDEN_ANGLE, TAU) : TAU * ra!;
      // Orbit: linear radius gives area density ~1/r. A band can carve a ring / inner hole.
      const reach = p.emission === 'orbit' ? orbitMin + (orbitMax - orbitMin) * rr! : 1 - p.reachJitter * rr!;
      const dir = rd! < (p.counterShare ?? 0) ? -1 : 1;
      const life = p.life[0] + (p.life[1] - p.life[0]) * rl!;
      const beat = beats[Math.min(beats.length - 1, Math.floor(rb! * beats.length))]!;
      s.p.set([a0, reach, dir], i * 3);
      s.v.set([life, beat, rq! * 0.08], i * 4);
      baseShape(s, i, p, dust, rs!, rc!, rf!);
      // Golden spirals: evenly spread phases from a second low-discrepancy sequence. It must not be
      // the golden-ratio sequence that drives the start angle, or every particle lands on one arc.
      s.time.set([p.golden ? (i * 0.7548776662466927 + 0.25) % 1 : rp!, 1 + 3 * rq!, tw, 0], i * 4);
    },

    prepare(view, time) {
      return { cx: view.width / 2, cy: view.height / 2, scale: Math.min(view.width, view.height) / 2, time };
    },

    sample(s, i, f, out) {
      const o = i * 4;
      const a0 = s.p[i * 3]!;
      const reach = s.p[i * 3 + 1]!;
      const dir = s.p[i * 3 + 2]!;
      const phase = s.time[o]!;
      const life = s.v[o]!;
      let rr: number;
      let angle: number;
      let a = alpha * s.shape[o + 1]! * twinkle(phase * TAU, s.time[o + 1]!, s.time[o + 2]!, f.time);
      let x = 0;
      if (p.emission === 'orbit') {
        rr = reach * p.reach * (1 + 0.04 * Math.sin(phase * TAU + 0.35 * f.time));
        angle = a0 + (dir * spin * f.time * 0.7) / (0.3 + reach);
      } else {
        let age: number;
        if (p.emission === 'stream') {
          age = loopAge(f.time, 1, phase, life);
        } else {
          age = wrap(f.time - s.v[o + 1]! - s.v[o + 2]!, p.period ?? 4);
          if (age > life) return false;
          a *= 1 + (p.flash ?? 0) * Math.exp(-age * 6);
        }
        x = age / life;
        const c = radialCurve(p.curve, x);
        rr = reach * p.reach * c;
        angle = a0 + dir * spin * age + twist * reach * c;
        a *= lifeFade(x, fadeIn, fadeOut);
      }
      const px = Math.cos(angle) * rr * f.scale;
      const py = Math.sin(angle) * rr * f.scale * squash;
      out.x = f.cx + px * cosRotation - py * sinRotation;
      out.y = f.cy + px * sinRotation + py * cosRotation;
      out.alpha = a;
      out.radius = s.shape[o]! * (1 + (p.grow ?? 0) * x);
      const last = s.palette.colors.length - 1;
      const orbitT = (reach - orbitMin) / Math.max(1e-6, orbitMax - orbitMin);
      const baseColor = p.emission === 'orbit' && p.colorByRadius ? Math.min(1, Math.max(0, orbitT)) * last : s.shape[o + 3]!;
      out.color = Math.min(last, baseColor + (p.cool ?? 0) * x);
      out.flare = s.shape[o + 2]!;
      out.soft = 0;
      return true;
    },

    ...(p.haze ? { haze: hazeFrom(p.haze)! } : {}),
  };
}
