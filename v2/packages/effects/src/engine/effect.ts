import type { GlitterFXConfig, RendererId } from '@glitterfx/core';
import { resolvePalette } from '../palettes.js';
import { createRandom } from '../random.js';
import { createParticleStore, particleCounts, type Budget, type ParticleStore } from './store.js';

export interface View {
  /** CSS px. */
  readonly width: number;
  readonly height: number;
}

/** An effect-specific setting, e.g. galaxy arm count. Values arrive via `config.params`. */
export interface EffectParam {
  readonly min: number;
  readonly max: number;
  readonly default: number;
  /** Values snap to this step (1 = integer). */
  readonly step?: number;
  readonly label?: string;
}

/** Resolved parameter values: every declared key present, clamped and snapped. */
export type ParamValues = Readonly<Record<string, number>>;

/** One particle, evaluated for one frame. Radius before `size`, alpha before `brightness`. */
export interface ParticleSample {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  /** Palette position: integer = one color; WebGL blends fractional positions, Canvas rounds. */
  color: number;
  flare: number;
  /** Depth-of-field softness 0..1: widens the core and spreads its energy. Default 0. */
  soft: number;
}

/** A soft elliptical haze blob in CSS px. Rendered behind particles when `haze` > 0. */
export interface HazeBlob {
  x: number;
  y: number;
  rx: number;
  ry: number;
  /** Rotation (rad). */
  angle: number;
  /** Palette position. */
  color: number;
  intensity: number;
}

export const MAX_HAZE_BLOBS = 6;

/**
 * A particle effect's backend-independent definition. Canvas evaluates `sample` per particle;
 * WebGL evaluates the equivalent GLSL registered for the same id in backend-webgl.
 */
export interface ParticleEffect<Frame = unknown> {
  readonly id: string;
  readonly defaultPalette: string;
  readonly budget: Budget;
  /** Random draws per particle. `generate` receives exactly this many. */
  readonly draws: number;
  /** Effect-specific settings. They shape generation, so changing one regenerates particles. */
  readonly params?: Readonly<Record<string, EffectParam>>;
  generate(store: ParticleStore, i: number, r: Float64Array, dust: boolean, params: ParamValues): void;
  /** Per-frame constants shared by all particles. */
  prepare(view: View, time: number, config: GlitterFXConfig): Frame;
  sample(store: ParticleStore, i: number, frame: Frame, out: ParticleSample): boolean;
  /**
   * Optional motion trails for high-fidelity backends: each particle is also drawn at
   * `count - 1` earlier times, `spacing` seconds apart. Canvas draws heads only.
   */
  readonly trail?: {
    readonly count: number;
    readonly spacing: number;
    /** Samples Canvas draws (including the head). Default 1 = heads only. */
    readonly canvas?: number;
  };
  /**
   * Set by archetype factories: backends with a code-generated renderer (WebGL GLSL) build it
   * from `kind` + `params`. Hand-written effects leave this undefined.
   */
  readonly archetype?: { readonly kind: string; readonly params: unknown };
  /** Optional haze layout (at most MAX_HAZE_BLOBS), evaluated once per frame. */
  haze?(view: View, time: number, config: GlitterFXConfig): HazeBlob[];
}

export const emptySample = (): ParticleSample => ({ x: 0, y: 0, radius: 0, alpha: 0, color: 0, flare: 0, soft: 0 });

/** Resolve `config.params` against an effect's declarations: defaults, clamping, step snapping. */
export function resolveParams(effect: ParticleEffect, config: GlitterFXConfig): ParamValues {
  const out: Record<string, number> = {};
  for (const [key, p] of Object.entries(effect.params ?? {})) {
    const raw = config.params[key] ?? p.default;
    const snapped = p.step ? Math.round((raw - p.min) / p.step) * p.step + p.min : raw;
    out[key] = Math.min(p.max, Math.max(p.min, snapped));
  }
  return out;
}

/** Golden-ratio sequence: well-distributed per-particle thresholds for dissolves. */
const particleHash = (i: number): number => (i * 0.618033988749895 + 0.5) % 1;

/**
 * Deterministic, prefix-stable generation: every particle consumes `effect.draws` numbers,
 * so a larger budget only appends particles.
 */
export function generateParticles(effect: ParticleEffect, renderer: RendererId, config: GlitterFXConfig): ParticleStore {
  const { count, primaryCount } = particleCounts(effect.budget, renderer, config);
  const store = createParticleStore(count, primaryCount, resolvePalette(config.palette, effect.defaultPalette));
  const random = createRandom(config.seed);
  const r = new Float64Array(effect.draws);
  const params = resolveParams(effect, config);
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < r.length; k++) r[k] = random();
    store.v[i * 4 + 3] = particleHash(i);
    effect.generate(store, i, r, i >= primaryCount, params);
  }
  return store;
}

/** Config changes that require regenerating particle data. Everything else is a uniform. */
export const needsRegenerate = (a: GlitterFXConfig, b: GlitterFXConfig): boolean =>
  a.effect !== b.effect ||
  a.seed !== b.seed ||
  a.density !== b.density ||
  a.quality !== b.quality ||
  a.palette !== b.palette ||
  !sameParams(a.params, b.params);

function sameParams(a: ParamValues, b: ParamValues): boolean {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
}
