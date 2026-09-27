/**
 * Star Field. GLSL mirror: backend-webgl/src/effects/star-field.ts.
 */
import type { ParticleEffect } from './engine/effect.js';
import { twinkle, wrap } from './engine/behaviors.js';
import { createRandom } from './random.js';

/** Drift direction (unit vector) and speed in fractions of the larger viewport side per second at depth 1. */
export const STAR_DRIFT = { x: 0.94, y: -0.34, speed: 0.012 } as const;
/** Extra wrap margin in CSS px so halos never pop at the edges. */
export const STAR_EDGE_MARGIN = 32;

const FLARE_CHANCE = 0.012;
const DUST_INTENSITY = 0.3;
const DUST_SIZE = 0.5;

interface StarFrame {
  ew: number;
  eh: number;
  dx: number;
  dy: number;
  time: number;
}

export const starField: ParticleEffect<StarFrame> = {
  id: 'star-field',
  defaultPalette: 'starlight',
  budget: {
    canvas: { eco: 350, balanced: 800, high: 1500 },
    webgl: { eco: 2500, balanced: 6000, high: 14000 },
  },
  draws: 9,

  generate(s, i, r, dust) {
    const [rx, ry, rd, rs, rc, rp, rr, ra, rf] = r as unknown as number[];
    const flare = !dust && rf! < FLARE_CHANCE;
    const pal = s.palette.weights;
    const total = pal.reduce((a, b) => a + b, 0);
    let pick = rc! * total;
    let color = pal.length - 1;
    for (let k = 0; k < pal.length; k++) {
      pick -= pal[k]!;
      if (pick < 0) {
        color = k;
        break;
      }
    }
    const base = flare ? 1.9 + 1.5 * rs! : 0.55 + 1.9 * rs! ** 3.5;
    s.p.set([rx!, ry!, 0.15 + 0.85 * rd! * rd!], i * 3);
    s.shape.set([dust ? base * DUST_SIZE : base, dust ? DUST_INTENSITY : flare ? 1.25 : 1, flare ? 1 : 0, color], i * 4);
    s.time.set([rp! * Math.PI * 2, 0.6 + 2.8 * rr!, (0.15 + 0.55 * ra!) * (flare ? 0.4 : 1), 0], i * 4);
  },

  prepare(view, time) {
    const m = STAR_EDGE_MARGIN;
    const travel = STAR_DRIFT.speed * Math.max(view.width, view.height) * time;
    return { ew: view.width + 2 * m, eh: view.height + 2 * m, dx: STAR_DRIFT.x * travel, dy: STAR_DRIFT.y * travel, time };
  },

  sample(s, i, f, out) {
    const d = s.p[i * 3 + 2]!;
    const par = d * d;
    const o = i * 4;
    out.x = wrap(s.p[i * 3]! * f.ew + f.dx * par, f.ew) - STAR_EDGE_MARGIN;
    out.y = wrap(s.p[i * 3 + 1]! * f.eh + f.dy * par, f.eh) - STAR_EDGE_MARGIN;
    out.radius = s.shape[o]! * (0.35 + 0.65 * d);
    out.alpha = (0.25 + 0.75 * d) * s.shape[o + 1]! * twinkle(s.time[o]!, s.time[o + 1]!, s.time[o + 2]!, f.time);
    out.flare = s.shape[o + 2]!;
    out.color = s.shape[o + 3]!;
    out.soft = 0;
    return true;
  },

  haze(view, time, config) {
    // Five faint nebula clouds per seed (some wrap off-screen), drifting with the most distant layer.
    const rnd = createRandom(config.seed ^ 0x9e3779b9);
    const ref = Math.max(view.width, view.height);
    const travel = STAR_DRIFT.speed * ref * time * 0.15 * 0.15;
    return [0, 1, 2, 3, 4].map((k) => {
      const ew = view.width + ref;
      const eh = view.height + ref;
      return {
        x: wrap(rnd() * ew + STAR_DRIFT.x * travel, ew) - ref / 2,
        y: wrap(rnd() * eh + STAR_DRIFT.y * travel, eh) - ref / 2,
        rx: ref * (0.25 + 0.2 * rnd()),
        ry: ref * (0.12 + 0.12 * rnd()),
        angle: rnd() * Math.PI,
        color: 1 + (k % 3),
        intensity: 0.18 + 0.12 * rnd(),
      };
    });
  },
};
