/**
 * Supernova: periodic bursts. A bright shock shell, slower ejecta cooling from white to red,
 * and a pulsing remnant core. Closed-form: each particle's state is a function of time since
 * the last burst. GLSL mirror: backend-webgl/src/effects/supernova.ts.
 */
import type { ParticleEffect } from './engine/effect.js';
import { dragDisplacement, lifeFade, smoothstep, twinkle, wrap } from './engine/behaviors.js';
import { sphereDirection } from './engine/emitters.js';

export const SUPERNOVA = {
  /** Seconds between bursts. */
  period: 7,
  /** Burst radius unit as a fraction of the smaller viewport side. */
  extent: 0.5,
  shellShare: 0.4,
  coreShare: 0.12,
} as const;

interface NovaFrame {
  cx: number;
  cy: number;
  scale: number;
  time: number;
}

/** Kind codes stored in time.x. */
const SHELL = 0;
const EJECTA = 1;
const CORE = 2;

export const supernova: ParticleEffect<NovaFrame> = {
  id: 'supernova',
  defaultPalette: 'nova',
  budget: {
    canvas: { eco: 600, balanced: 1400, high: 2400 },
    webgl: { eco: 6000, balanced: 16000, high: 32000 },
  },
  draws: 8,

  generate(s, i, r, dust) {
    const [rk, r1, r2, rv, rd, rs, rl, rf] = r as unknown as number[];
    const kind = rk! < SUPERNOVA.shellShare ? SHELL : rk! < 1 - SUPERNOVA.coreShare ? EJECTA : CORE;
    const [dx, dy, dz] = sphereDirection(r1!, r2!);
    const speed = kind === SHELL ? 0.62 + 0.1 * rv! : kind === EJECTA ? 0.08 + 0.55 * rv! ** 1.5 : 0.02 + 0.06 * rv!;
    const drag = kind === SHELL ? 1.25 : kind === EJECTA ? 0.8 : 0.3;
    const life = kind === SHELL ? 3.2 + 1.8 * rl! : kind === EJECTA ? 2.5 + 3.5 * rl! : SUPERNOVA.period;
    const flare = !dust && kind === EJECTA && rf! < 0.006;
    const size = flare ? 1.8 + rs! : kind === CORE ? 1.2 + 1.8 * rs! : 0.5 + 1.4 * rs! ** 3;
    // Faster ejecta start hotter (lower palette position).
    const colorBase = kind === SHELL ? 0.6 * rs! : kind === EJECTA ? 1 + 2.2 * (1 - rv!) : 2 + rs!;
    s.p.set([dx, dy, dz], i * 3);
    s.v.set([speed, drag, rd! * 0.12], i * 4);
    s.shape.set([dust ? size * 0.55 : size, (dust ? 0.3 : 1) * (kind === CORE ? 0.8 : 1), flare ? 1 : 0, colorBase], i * 4);
    s.time.set([kind, 3 + 9 * rl!, kind === EJECTA ? 0.35 : 0.15, life], i * 4);
  },

  prepare(view, time) {
    return { cx: view.width / 2, cy: view.height / 2, scale: Math.min(view.width, view.height) * SUPERNOVA.extent, time };
  },

  sample(s, i, f, out) {
    const o = i * 4;
    const kind = s.time[o]!;
    const life = s.time[o + 3]!;
    const age = wrap(f.time - s.v[o + 2]!, SUPERNOVA.period);
    if (age > life) return false;
    const x = age / life;
    const dist = dragDisplacement(s.v[o]!, s.v[o + 1]!, age);
    const dz = s.p[i * 3 + 2]!;
    const persp = 1 + 0.3 * dz * dist;
    out.x = f.cx + s.p[i * 3]! * dist * f.scale * persp;
    out.y = f.cy + s.p[i * 3 + 1]! * dist * f.scale * persp;
    const flash = kind === EJECTA ? 1 : 1 + 2.5 * Math.exp(-age * 5);
    const pulse = kind === CORE ? 0.75 + 0.25 * Math.sin(f.time * 2.2 + s.v[o + 3]! * 6.283) : 1;
    out.alpha = s.shape[o + 1]! * lifeFade(x, 0.015, kind === CORE ? 0.2 : 0.65) * flash * pulse *
      twinkle(s.v[o + 3]! * 6.283, s.time[o + 1]!, s.time[o + 2]!, f.time);
    out.radius = s.shape[o]! * persp * (kind === SHELL ? 1.1 - 0.4 * x : 1);
    // Cools over its life.
    out.color = Math.min(s.palette.colors.length - 1, s.shape[o + 3]! + x * (kind === CORE ? 0.5 : 2.4));
    out.flare = s.shape[o + 2]!;
    // Particles flying towards the viewer blur.
    out.soft = smoothstep(0.35, 0.9, dz) * Math.min(1, dist * 2.5);
    return true;
  },

  haze(view, time) {
    const scale = Math.min(view.width, view.height) * SUPERNOVA.extent;
    const age = wrap(time, SUPERNOVA.period);
    const radius = scale * (0.12 + dragDisplacement(0.66, 1.25, age) * 1.1);
    return [
      // Expanding flash that settles into a remnant nebula.
      { x: view.width / 2, y: view.height / 2, rx: radius, ry: radius, angle: 0, color: 2, intensity: 0.25 + 0.9 * Math.exp(-age * 0.9) },
      { x: view.width / 2, y: view.height / 2, rx: scale * 0.18, ry: scale * 0.18, angle: 0, color: 0, intensity: 0.5 + 0.6 * Math.exp(-age * 3) },
    ];
  },
};
