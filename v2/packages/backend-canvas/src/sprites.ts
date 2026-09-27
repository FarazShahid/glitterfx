import { hazeFalloff, particleProfile, type Palette } from '@glitterfx/effects';

/** Sprite edge length in texels. Flares need room for thin spikes. */
const SPRITE = 64;
const FLARE_SPRITE = 256;

export interface Sprites {
  /** Indexed by palette color. */
  readonly normal: readonly HTMLCanvasElement[];
  readonly flare: readonly HTMLCanvasElement[];
}

/**
 * Bake the shared `particleProfile` into one sprite per palette color (and flare variant).
 * Straight alpha: rgb = tinted color, alpha = intensity, so additive ('lighter') compositing
 * adds color * intensity, the same as the WebGL shader.
 */
function bake(size: number, color: readonly [number, number, number], core: number, glow: number, flare: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const image = ctx.createImageData(size, size);
  const px = image.data;
  const [r, g, b] = color;
  for (let j = 0; j < size; j++) {
    const v = ((j + 0.5) / size) * 2 - 1;
    for (let i = 0; i < size; i++) {
      const u = ((i + 0.5) / size) * 2 - 1;
      const [intensity, white] = particleProfile(u, v, core, glow, flare);
      if (intensity <= 0) continue;
      const o = (j * size + i) * 4;
      px[o] = 255 * (r + (1 - r) * white);
      px[o + 1] = 255 * (g + (1 - g) * white);
      px[o + 2] = 255 * (b + (1 - b) * white);
      px[o + 3] = 255 * Math.min(1, intensity);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function buildSprites(palette: Palette, glow: number, coreFor: (flare: boolean) => number): Sprites {
  return {
    normal: palette.colors.map((c) => bake(SPRITE, c, coreFor(false), glow, false)),
    flare: palette.colors.map((c) => bake(FLARE_SPRITE, c, coreFor(true), glow, true)),
  };
}

const HAZE_SPRITE = 128;

/** Soft haze blob per palette color; drawn scaled/rotated to each blob's ellipse. */
export function buildHazeSprites(palette: Palette): HTMLCanvasElement[] {
  return palette.colors.map(([r, g, b]) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = HAZE_SPRITE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    const image = ctx.createImageData(HAZE_SPRITE, HAZE_SPRITE);
    for (let j = 0; j < HAZE_SPRITE; j++) {
      for (let i = 0; i < HAZE_SPRITE; i++) {
        const u = ((i + 0.5) / HAZE_SPRITE) * 2 - 1;
        const v = ((j + 0.5) / HAZE_SPRITE) * 2 - 1;
        const d2 = u * u + v * v;
        const o = (j * HAZE_SPRITE + i) * 4;
        image.data[o] = 255 * r;
        image.data[o + 1] = 255 * g;
        image.data[o + 2] = 255 * b;
        image.data[o + 3] = d2 >= 1 ? 0 : 255 * hazeFalloff(d2 * 1.4) * (1 - d2);
      }
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  });
}
