/**
 * Drift: particles travel in a direction through a wrapped view with sway, wander, gusts,
 * flutter and blink. Petals, snow, leaves, confetti, bubbles, meteors, sand, fireflies.
 */
import { lifeFade, smoothstep, TAU, turbulence, twinkle, wrap } from '../engine/behaviors.js';
import type { ParticleEffect } from '../engine/effect.js';
import { baseShape, budgetFrom, hazeFrom, WRAP_MARGIN, type ArchetypeBase } from './common.js';

export interface DriftParams extends ArchetypeBase {
  /** Direction and speed in view heights per second at depth 1. */
  readonly velocity: readonly [number, number];
  /** Per-particle speed spread 0..1. Default 0.3. */
  readonly speedJitter?: number;
  /** Sway perpendicular to travel: [amplitude (heights), angular frequency (rad/s)]. */
  readonly sway?: readonly [number, number];
  /** 2D turbulent wander amplitude (heights). */
  readonly wander?: number;
  /** Shared horizontal wind gusts amplitude (heights). */
  readonly gust?: number;
  /** Depth range; nearer particles move faster, look bigger and brighter. Default [0.25, 1]. */
  readonly depth?: readonly [number, number];
  /** Blink pulses: [pulses per second, duty 0..1]. */
  readonly blink?: readonly [number, number];
  /** Tumble: periodic size/brightness modulation 0..1. */
  readonly flutter?: number;
  /** Depth-of-field softness for the nearest particles 0..1. */
  readonly softNear?: number;
}

interface DriftFrame {
  ew: number;
  eh: number;
  h: number;
  nx: number;
  ny: number;
  gust: number;
  time: number;
  turb: [number, number];
}

/** Shared gust profile (heights at amplitude 1). Mirrored in GLSL. */
export const gustProfile = (t: number): number => Math.sin(0.23 * t) + 0.5 * Math.sin(0.61 * t + 1.3);

export function createDriftEffect(p: DriftParams): ParticleEffect<DriftFrame> {
  const [d0, d1] = p.depth ?? [0.25, 1];
  const [vx, vy] = p.velocity;
  const len = Math.hypot(vx, vy);
  const nx = len > 0 ? -vy / len : 1;
  const ny = len > 0 ? vx / len : 0;
  const [swayAmp, swayFreq] = p.sway ?? [0, 0];
  const jitter = p.speedJitter ?? 0.3;
  const tw = p.twinkle ?? 0.2;
  const alpha = p.alpha ?? 1;

  return {
    id: p.id,
    defaultPalette: p.palette,
    budget: budgetFrom(p.counts),
    draws: 10,
    ...(p.trail ? { trail: p.trail } : {}),
    archetype: { kind: 'drift', params: p },

    generate(s, i, r, dust) {
      const [rx, ry, rz, rs, rc, rp, rj, rq, rb, rf] = r as unknown as number[];
      s.p.set([rx!, ry!, d0 + (d1 - d0) * rz!], i * 3);
      s.v.set([1 + jitter * (2 * rj! - 1), 0.7 + 0.6 * rq!, p.blink ? p.blink[0] * (0.6 + 0.8 * rb!) : 0], i * 4);
      baseShape(s, i, p, dust, rs!, rc!, rf!);
      s.time.set([rp! * TAU, 1 + 3 * rq!, tw, 1.5 + 2.5 * rb!], i * 4);
    },

    prepare(view, time) {
      const m = WRAP_MARGIN;
      return { ew: view.width + 2 * m, eh: view.height + 2 * m, h: view.height, nx, ny, gust: gustProfile(time), time, turb: [0, 0] };
    },

    sample(s, i, f, out) {
      const o = i * 4;
      const d = s.p[i * 3 + 2]!;
      const par = 0.35 + 0.65 * d;
      const phase = s.time[o]!;
      const move = par * s.v[o]! * f.time * f.h;
      const sw = swayAmp * f.h * par * Math.sin(swayFreq * s.v[o + 1]! * f.time + phase);
      let x = s.p[i * 3]! * f.ew + vx * move + f.nx * sw + (p.gust ?? 0) * f.h * par * f.gust;
      let y = s.p[i * 3 + 1]! * f.eh + vy * move + f.ny * sw;
      if (p.wander) {
        turbulence(s.p[i * 3]! * 5 + phase, s.p[i * 3 + 1]! * 5, f.time * 0.25, f.turb);
        x += f.turb[0] * p.wander * f.h;
        y += f.turb[1] * p.wander * f.h;
      }
      out.x = wrap(x, f.ew) - WRAP_MARGIN;
      out.y = wrap(y, f.eh) - WRAP_MARGIN;
      let a = alpha * s.shape[o + 1]! * (0.35 + 0.65 * d) * twinkle(phase, s.time[o + 1]!, s.time[o + 2]!, f.time);
      let radius = s.shape[o]! * (0.45 + 0.75 * d);
      if (p.flutter) {
        const tumble = 0.5 + 0.5 * Math.sin(f.time * s.time[o + 3]! + phase * 3);
        radius *= 1 - 0.5 * p.flutter * tumble;
        a *= 1 - 0.35 * p.flutter * tumble;
      }
      if (p.blink) {
        const u = wrap(f.time * s.v[o + 2]! + phase / TAU, 1);
        a *= 0.04 + 0.96 * lifeFade(u / p.blink[1], 0.25, 0.4) * (u < p.blink[1] ? 1 : 0);
      }
      out.alpha = a;
      out.radius = radius;
      out.color = s.shape[o + 3]!;
      out.flare = s.shape[o + 2]!;
      out.soft = (p.softNear ?? 0) * smoothstep(0.8, 1, d);
      return true;
    },

    ...(p.haze ? { haze: hazeFrom(p.haze)! } : {}),
  };
}
