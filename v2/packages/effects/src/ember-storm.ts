/**
 * Ember Storm: embers rise with buoyancy against drag, drift with wind, sway with turbulence,
 * flicker and cool over their life. Near embers are large and out of focus. GLSL mirror:
 * backend-webgl/src/effects/ember-storm.ts.
 */
import type { ParticleEffect } from './engine/effect.js';
import { forcedDisplacement, lifeFade, loopAge, smoothstep, turbulence, twinkle } from './engine/behaviors.js';

interface EmberFrame {
  width: number;
  height: number;
  time: number;
  turb: [number, number];
}

export const emberStorm: ParticleEffect<EmberFrame> = {
  id: 'ember-storm',
  defaultPalette: 'ember',
  budget: {
    canvas: { eco: 300, balanced: 700, high: 1300 },
    webgl: { eco: 3000, balanced: 8000, high: 18000 },
  },
  draws: 9,
  trail: { count: 4, spacing: 0.035 },

  generate(s, i, r, dust) {
    const [rx, ry, rz, rg, rk, rw, rp, rl, rs] = r as unknown as number[];
    const depth = 0.2 + 0.8 * rz!;
    s.p.set([-0.1 + 1.2 * rx!, 0.02 + 0.1 * ry!, depth], i * 3);
    // buoyancy (heights/s^2), drag (1/s), wind (widths/s)
    s.v.set([0.35 + 0.45 * rg!, 0.7 + 0.8 * rk!, 0.03 + 0.07 * rw!], i * 4);
    const size = (0.6 + 1.3 * rs! ** 2) * (0.5 + 0.9 * depth);
    s.shape.set([dust ? size * 0.5 : size, dust ? 0.4 : 1.35, 0, 0.7 + 0.6 * rs!], i * 4);
    s.time.set([rp!, 8 + 14 * rl!, 0.25 + 0.35 * rs!, 3.5 + 4 * rl!], i * 4);
  },

  prepare(view, time) {
    return { width: view.width, height: view.height, time, turb: [0, 0] };
  },

  sample(s, i, f, out) {
    const o = i * 4;
    const depth = s.p[i * 3 + 2]!;
    const life = s.time[o + 3]!;
    const age = loopAge(f.time, 1, s.time[o]!, life);
    const x = age / life;
    const par = 0.6 + 0.6 * depth;
    const rise = forcedDisplacement(s.v[o]!, s.v[o + 1]!, age) * f.height * par;
    turbulence(s.p[i * 3]! * 4 + s.time[o]! * 7, age * 0.35, f.time * 0.5, f.turb);
    out.x = s.p[i * 3]! * f.width + s.v[o + 2]! * age * f.width * par + f.turb[0] * f.height * 0.04 * (0.3 + age * 0.3);
    out.y = f.height * (1 + s.p[i * 3 + 1]!) - rise + f.turb[1] * f.height * 0.012;
    out.radius = s.shape[o]!;
    out.alpha = s.shape[o + 1]! * lifeFade(x, 0.06, 0.5) * (0.55 + 0.45 * depth) * twinkle(s.v[o + 3]! * 6.283, s.time[o + 1]!, s.time[o + 2]!, f.time);
    // Cools from white-hot to deep red.
    out.color = Math.min(s.palette.colors.length - 1, s.shape[o + 3]! + x * (s.palette.colors.length - 2));
    out.flare = 0;
    out.soft = smoothstep(0.78, 1, depth);
    return true;
  },

  haze(view, time) {
    const flicker = 0.85 + 0.15 * Math.sin(time * 1.7) * Math.sin(time * 0.63);
    return [
      { x: view.width * 0.3, y: view.height * 1.02, rx: view.width * 0.55, ry: view.height * 0.32, angle: 0, color: 3, intensity: 0.55 * flicker },
      { x: view.width * 0.75, y: view.height * 1.05, rx: view.width * 0.5, ry: view.height * 0.26, angle: 0, color: 2, intensity: 0.4 * flicker },
    ];
  },
};
