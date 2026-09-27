import type { GlitterFXConfig, Quality, RendererId } from '@glitterfx/core';
import type { Palette } from '../palettes.js';

/**
 * Data-oriented particle state shared by every backend. Channel meaning is effect-defined;
 * the layout is fixed so both renderers (and WebGL attributes) handle every effect the same way.
 */
export interface ParticleStore {
  readonly count: number;
  /** Particles `[0, primaryCount)` are identical on every backend for a given seed. */
  readonly primaryCount: number;
  /** 3 per particle: effect-defined position-like vector. */
  readonly p: Float32Array;
  /** 4 per particle: effect-defined vector; `w` is a per-particle hash in [0, 1). */
  readonly v: Float32Array;
  /** 4 per particle: size (CSS px), intensity, flare (0/1), palette position. */
  readonly shape: Float32Array;
  /** 4 per particle: phase, rate, amplitude, life. */
  readonly time: Float32Array;
  readonly palette: Palette;
}

/** Particle counts per backend and quality at density 1. WebGL must be >= Canvas. */
export type Budget = Readonly<Record<RendererId, Readonly<Record<Quality, number>>>>;

export function particleCounts(budget: Budget, renderer: RendererId, config: GlitterFXConfig): { count: number; primaryCount: number } {
  const primaryCount = Math.round(budget.canvas[config.quality] * config.density);
  const count = Math.max(primaryCount, Math.round(budget[renderer][config.quality] * config.density));
  return { count, primaryCount };
}

export function createParticleStore(count: number, primaryCount: number, palette: Palette): ParticleStore {
  return {
    count,
    primaryCount,
    p: new Float32Array(count * 3),
    v: new Float32Array(count * 4),
    shape: new Float32Array(count * 4),
    time: new Float32Array(count * 4),
    palette,
  };
}
