/**
 * Quantum: particles rest, then snap to a partner position and back, dimming mid-jump.
 * Quantum field.
 */
import { smoothstep, TAU, twinkle, wrap } from '../engine/behaviors.js';
import type { ParticleEffect } from '../engine/effect.js';
import { baseShape, budgetFrom, hazeFrom, WRAP_MARGIN, type ArchetypeBase } from './common.js';

export interface QuantumParams extends ArchetypeBase {
  /** Jumps per second range. */
  readonly rate: readonly [number, number];
  /** Max hop distance as a fraction of the smaller side. */
  readonly hop: number;
  /** Fraction of each cycle spent resting 0..1. */
  readonly dwell: number;
}

interface QuantumFrame {
  ew: number;
  eh: number;
  scale: number;
  time: number;
}

export function createQuantumEffect(p: QuantumParams): ParticleEffect<QuantumFrame> {
  const tw = p.twinkle ?? 0.2;
  const alpha = p.alpha ?? 1;
  return {
    id: p.id,
    defaultPalette: p.palette,
    budget: budgetFrom(p.counts),
    draws: 10,
    ...(p.trail ? { trail: p.trail } : {}),
    archetype: { kind: 'quantum', params: p },

    generate(s, i, r, dust) {
      const [rx, ry, rhx, rhy, rs, rc, rp, rr, rf, rz] = r as unknown as number[];
      s.p.set([rx!, ry!, 0.4 + 0.6 * rz!], i * 3);
      s.v.set([(2 * rhx! - 1) * p.hop, (2 * rhy! - 1) * p.hop, p.rate[0] + (p.rate[1] - p.rate[0]) * rr!], i * 4);
      baseShape(s, i, p, dust, rs!, rc!, rf!);
      s.time.set([rp!, 1 + 3 * rr!, tw, 0], i * 4);
    },

    prepare(view, time) {
      return { ew: view.width + 2 * WRAP_MARGIN, eh: view.height + 2 * WRAP_MARGIN, scale: Math.min(view.width, view.height), time };
    },

    sample(s, i, f, out) {
      const o = i * 4;
      const phase = s.time[o]!;
      const u = f.time * s.v[o + 2]! + phase;
      const n = Math.floor(u);
      const jump = smoothstep(p.dwell, 1, u - n);
      const w = n % 2 === 1 ? 1 - jump : jump;
      const drift = 0.03 * Math.sin(0.07 * f.time + phase * TAU);
      out.x = wrap(s.p[i * 3]! * f.ew + (s.v[o]! * w + drift) * f.scale, f.ew) - WRAP_MARGIN;
      out.y = wrap(s.p[i * 3 + 1]! * f.eh + s.v[o + 1]! * w * f.scale, f.eh) - WRAP_MARGIN;
      const d = s.p[i * 3 + 2]!;
      out.alpha = alpha * s.shape[o + 1]! * d * (1 - 0.85 * Math.sin(Math.PI * jump)) * twinkle(phase * TAU, s.time[o + 1]!, s.time[o + 2]!, f.time);
      out.radius = s.shape[o]! * (0.5 + 0.6 * d);
      out.color = s.shape[o + 3]!;
      out.flare = s.shape[o + 2]!;
      out.soft = 0;
      return true;
    },

    ...(p.haze ? { haze: hazeFrom(p.haze)! } : {}),
  };
}
