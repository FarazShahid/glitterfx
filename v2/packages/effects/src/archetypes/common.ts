/**
 * Shared pieces for archetype factories: budgets, weighted color picks, base look, and
 * static haze layouts. Each archetype is one closed-form motion model parameterized per effect;
 * its GLSL mirror lives in backend-webgl/src/archetypes.ts.
 */
import type { HazeBlob, View } from '../engine/effect.js';
import type { Budget, ParticleStore } from '../engine/store.js';

export interface ArchetypeBase {
  readonly id: string;
  readonly palette: string;
  /** Particle counts at balanced quality: [canvas, webgl]. Eco = 0.45x, high = 1.8x. */
  readonly counts: readonly [number, number];
  /** Core radius range in CSS px and a distribution exponent (higher = more small particles). */
  readonly size: readonly [number, number, number];
  /** Base opacity multiplier. Default 1. */
  readonly alpha?: number;
  /** Twinkle amplitude 0..1. Default 0.2. */
  readonly twinkle?: number;
  readonly flareChance?: number;
  readonly trail?: { readonly count: number; readonly spacing: number; readonly canvas?: number };
  readonly haze?: readonly HazeSpec[];
}

/** Haze blob in view fractions: x/y of width/height, rx/ry of the larger side. */
export interface HazeSpec {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
  readonly angle?: number;
  readonly color: number;
  readonly intensity: number;
}

export const budgetFrom = ([canvas, webgl]: readonly [number, number]): Budget => ({
  canvas: { eco: Math.round(canvas * 0.45), balanced: canvas, high: Math.round(canvas * 1.8) },
  webgl: { eco: Math.round(webgl * 0.45), balanced: webgl, high: Math.round(webgl * 1.8) },
});

export function pickWeighted(weights: readonly number[], r: number): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let pick = r * total;
  for (let k = 0; k < weights.length; k++) {
    pick -= weights[k]!;
    if (pick < 0) return k;
  }
  return weights.length - 1;
}

/** Fill the shape channel: size, intensity (dust dimmer), flare, color. Uses draws rs, rc, rf. */
export function baseShape(s: ParticleStore, i: number, p: ArchetypeBase, dust: boolean, rs: number, rc: number, rf: number): void {
  const [min, max, pow] = p.size;
  const flare = !dust && rf < (p.flareChance ?? 0);
  const size = flare ? max * 1.3 : min + (max - min) * rs ** pow;
  s.shape.set([dust ? size * 0.55 : size, dust ? 0.35 : 1, flare ? 1 : 0, pickWeighted(s.palette.weights, rc)], i * 4);
}

/** Static haze with slow breathing, from view-fraction specs. */
export function hazeFrom(specs: readonly HazeSpec[] | undefined): ((view: View, time: number) => HazeBlob[]) | undefined {
  if (!specs?.length) return undefined;
  return (view, time) => {
    const ref = Math.max(view.width, view.height);
    return specs.map((h, k) => ({
      x: h.x * view.width,
      y: h.y * view.height,
      rx: h.rx * ref,
      ry: h.ry * ref,
      angle: h.angle ?? 0,
      color: h.color,
      intensity: h.intensity * (0.85 + 0.15 * Math.sin(time * 0.21 + k * 1.9)),
    }));
  };
}

/** Wrap margin (CSS px) for effects that wrap particles through the view edges. */
export const WRAP_MARGIN = 40;
