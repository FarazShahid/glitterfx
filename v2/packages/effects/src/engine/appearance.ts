/**
 * Shared particle look. `particleProfile` is baked into Canvas sprites and evaluated per pixel in
 * the WebGL fragment shader (backend-webgl/src/particles.ts). Keep them in sync.
 */

/** Halo extent as a multiple of the core radius. Flares get room for spikes. */
export const haloScale = (glow: number, flare: boolean): number => (2 + 6 * glow) * (flare ? 2.5 : 1);

/**
 * Intensity at `(u, v)` in [-1, 1] (sprite radius 1). `core` is the core radius as a fraction of
 * the sprite radius. Returns [intensity, whiteness].
 */
export function particleProfile(u: number, v: number, core: number, glow: number, flare: boolean): [number, number] {
  const r2 = u * u + v * v;
  if (r2 >= 1) return [0, 0];
  const s = Math.sqrt(r2) / core;
  const window = (1 - r2) * (1 - r2);
  const coreI = Math.exp(-s * s * 1.8);
  const halo = Math.exp(-s * 0.8) * (0.14 + 0.6 * glow) * window;
  let spikes = 0;
  if (flare) {
    const w = core * 0.28;
    spikes =
      (Math.exp(-Math.abs(v) / w) * (1 - Math.abs(u)) ** 4 + Math.exp(-Math.abs(u) / w) * (1 - Math.abs(v)) ** 4) * 0.9 * window;
  }
  return [coreI + halo + spikes, Math.min(1, coreI * 0.7)];
}

/**
 * Depth-of-field: a soft particle spreads the same energy over a wider core.
 * Returns [coreScale, intensityScale]. Mirrored in the WebGL vertex shader.
 */
export const softness = (soft: number): [number, number] => [1 + 2.5 * soft, 1 / (1 + 1.6 * soft)];

/** Haze falloff at normalized blob distance d (1 = blob radius). Mirrored in GLSL. */
export const hazeFalloff = (d2: number): number => Math.exp(-3 * d2);
