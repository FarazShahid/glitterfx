/**
 * Glitter Shimmer: the flagship GlitterFX look. Dense micro-glitter floats slowly in depth; each flake
 * shimmers irregularly and, on rare glints, flashes with a star-cross flare (the flare sprite is chosen
 * per frame from the glint). A sparse population of larger flakes glints longer and harder. Far flakes
 * are soft, near flakes crisp. Settings (params) are baked into particle channels, so WebGL reads them
 * as attributes. GLSL mirror: backend-webgl/src/effects/glitter-shimmer.ts.
 */
import type { ParticleEffect } from './engine/effect.js';
import { glintPulse, TAU, wrap } from './engine/behaviors.js';
import { pickWeighted, WRAP_MARGIN } from './archetypes/common.js';

export const GLITTER = {
  /** Upward float (view heights per second at depth 1) and sway amplitude (heights). */
  drift: 0.006,
  sway: 0.004,
  /** Share of larger, harder-glinting flakes, and of large out-of-focus foreground bokeh flakes. */
  flareShare: 0.04,
  bokehShare: 0.02,
  /** Glint exponents: micro flakes flash briefly, large flakes a little longer. */
  microSharpness: 36,
  flareSharpness: 18,
  /** Glint above this shows the star-cross flare sprite. */
  flareThreshold: 0.3,
} as const;

/** Bokeh uses the warm end of the palette (gold, then rose): white bokeh reads as grey haze. */
const warmColor = (colors: number, r: number): number => Math.min(colors - 1, r < 0.65 ? 1 : 4);

interface GlitterFrame {
  ew: number;
  eh: number;
  width: number;
  height: number;
  time: number;
  pulse: [number, number];
}

export const glitterShimmer: ParticleEffect<GlitterFrame> = {
  id: 'glitter-shimmer',
  defaultPalette: 'glitter',
  budget: {
    canvas: { eco: 900, balanced: 2000, high: 3600 },
    webgl: { eco: 8000, balanced: 22000, high: 44000 },
  },
  draws: 10,
  params: {
    flareRate: { min: 0.2, max: 3, default: 1, label: 'Flare rate' },
    shimmer: { min: 0, max: 1, default: 0.6, label: 'Shimmer' },
    depth: { min: 0, max: 1, default: 0.7, label: 'Depth' },
    wave: { min: 0, max: 1, default: 0, label: 'Shimmer wave' },
  },

  generate(s, i, r, dust, params) {
    const [rx, ry, rz, rs, rc, rp, rr, rf, rw, rk] = r as unknown as number[];
    const big = !dust && rf! < GLITTER.flareShare;
    const bokeh = !dust && !big && rf! < GLITTER.flareShare + GLITTER.bokehShare;
    // Depth spread: 0 = flat sheet at mid depth, 1 = full near/far range. Bokeh sits in front (depth > 1).
    const depth = bokeh ? 1.15 + 0.3 * rz! * params['depth']! : 0.6 + (rz! - 0.5) * 0.8 * params['depth']!;
    const size = bokeh ? 2.5 + 3 * rs! : big ? 1.3 + 1.4 * rs! : 0.5 + 1.0 * rs! ** 2;
    s.p.set([rx!, ry!, depth], i * 3);
    // sway phase, shimmer-wave strength, glint boost
    s.v.set([rw! * TAU, params['wave']!, bokeh ? 0.25 : big ? 3 : 2], i * 4);
    s.shape.set([dust ? size * 0.7 : size, dust ? 0.5 : bokeh ? 0.13 : big ? 1.2 : 1, 0, bokeh ? warmColor(s.palette.colors.length, rc!) : pickWeighted(s.palette.weights, rc!)], i * 4);
    // phase, glint rate (glints every ~16 / rate s), shimmer amount, glint sharpness
    const rate = (big ? 3.5 : 2.5 + 3 * rk!) * params['flareRate']!;
    s.time.set([rp! * TAU, rate * (0.8 + 0.4 * rr!), params['shimmer']!, big ? GLITTER.flareSharpness : GLITTER.microSharpness], i * 4);
  },

  prepare(view, time) {
    const m = WRAP_MARGIN;
    return { ew: view.width + 2 * m, eh: view.height + 2 * m, width: view.width, height: view.height, time, pulse: [0, 0] };
  },

  sample(s, i, f, out) {
    const o = i * 4;
    const d = s.p[i * 3 + 2]!;
    const par = 0.4 + 0.6 * d;
    const sway = s.v[o]!;
    const h = f.height;
    const x = s.p[i * 3]! * f.ew + GLITTER.sway * h * par * Math.sin(0.23 * f.time + sway);
    const y = s.p[i * 3 + 1]! * f.eh - GLITTER.drift * h * par * f.time + GLITTER.sway * h * par * Math.sin(0.17 * f.time + sway * 1.7);
    out.x = wrap(x, f.ew) - WRAP_MARGIN;
    out.y = wrap(y, f.eh) - WRAP_MARGIN;

    const [shimmer, glint0] = glintPulse(s.time[o]!, s.time[o + 1]!, f.time, s.time[o + 3]!, f.pulse);
    // Optional diagonal wave of light sweeping across the glitter.
    const w = s.v[o + 1]!;
    const band = w > 0 ? Math.max(0, Math.sin((out.x / f.width + 0.6 * (out.y / h)) * 4.2 - f.time * 1.1)) ** 6 : 0;
    // Only some flakes (by hash) flare in the wave; the rest just brighten, so the band never clips.
    const glint = Math.min(1, glint0 + (s.v[o + 3]! > 0.65 ? w * band * 0.5 : 0));
    const amount = s.time[o + 2]!;
    out.alpha = s.shape[o + 1]! * (0.3 + 0.7 * d) * (1 - amount + amount * shimmer) * (1 + w * band) + glint * s.v[o + 2]!;
    out.radius = s.shape[o]! * (0.5 + 0.6 * d) * (1 + 0.8 * glint);
    out.flare = glint > GLITTER.flareThreshold && d <= 1 ? 1 : 0;
    out.color = s.shape[o + 3]!;
    // Far flakes and foreground bokeh are out of focus; the mid layer is crisp.
    out.soft = d > 1 ? 1 : Math.max(0, 0.55 - d) * 1.2;
    return true;
  },

  haze(view, time) {
    // Faint warm light the glitter sits in (only drawn when the `haze` option is above 0).
    const ref = Math.max(view.width, view.height);
    return [
      { x: view.width * 0.3, y: view.height * 0.35, rx: ref * 0.35, ry: ref * 0.22, angle: -0.3, color: 1, intensity: 0.35 + 0.05 * Math.sin(time * 0.3) },
      { x: view.width * 0.72, y: view.height * 0.65, rx: ref * 0.32, ry: ref * 0.2, angle: 0.4, color: 4, intensity: 0.25 + 0.05 * Math.sin(time * 0.23 + 1) },
    ];
  },
};
