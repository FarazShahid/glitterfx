import type { GlitterFXConfig } from '@glitterfx/core';
import {
  MAX_HAZE_BLOBS,
  emptySample,
  generateParticles,
  haloScale,
  softness,
  needsRegenerate,
  type ParticleEffect,
  type ParticleSample,
  type ParticleStore,
} from '@glitterfx/effects';
import { buildHazeSprites, buildSprites, type Sprites } from './sprites.js';

/**
 * One particle effect on the Canvas backend: its data, sprites and per-frame evaluation.
 * The backend composes layers for normal rendering, dissolves and morphs.
 */
export interface CanvasLayer {
  resize(width: number, height: number): void;
  update(config: GlitterFXConfig): void;
  /** Evaluate frame constants; call before `sample`. */
  prepare(time: number): void;
  readonly count: number;
  sample(i: number, out: ParticleSample): boolean;
  hash(i: number): number;
  /** Draw one evaluated particle with a final alpha (brightness already applied by caller). */
  paint(ctx: CanvasRenderingContext2D, s: ParticleSample, alpha: number): void;
  /** Draw the haze layer (no-op when `haze` is 0 or the effect has none). */
  drawHaze(ctx: CanvasRenderingContext2D, time: number, weight: number): void;
  /** Draw the whole layer. `reveal` < 1 dissolves particles by their hash. */
  draw(ctx: CanvasRenderingContext2D, time: number, reveal: number): void;
  readonly brightness: number;
  destroy(): void;
}

export function createCanvasLayer(effect: ParticleEffect, initial: GlitterFXConfig): CanvasLayer {
  let config = initial;
  let store: ParticleStore = generateParticles(effect, 'canvas', config);
  /** Sprite sets per softness level (0 sharp, 1 half, 2 fully soft), built on demand. */
  let sprites: (Sprites | null)[] = [null, null, null];
  let spriteGlow = -1;
  let hazeSprites: HTMLCanvasElement[] | null = null;
  let width = 0;
  let height = 0;
  let frame: unknown = null;
  let halo = 1;
  let flareHalo = 1;
  const s: ParticleSample = emptySample();

  // Built lazily so dragging the glow slider rebuilds at most once per frame.
  function spritesFor(level: number): Sprites {
    if (spriteGlow !== config.glow) {
      sprites = [null, null, null];
      spriteGlow = config.glow;
    }
    const [coreScale] = softness(level / 2);
    return (sprites[level] ??= buildSprites(store.palette, config.glow, (flare) =>
      Math.min(0.95, coreScale / haloScale(config.glow, flare)),
    ));
  }

  const layer: CanvasLayer = {
    resize(w, h) {
      width = w;
      height = h;
    },

    update(next) {
      if (needsRegenerate(config, next)) {
        if (next.palette !== config.palette) {
          sprites = [null, null, null];
          hazeSprites = null;
        }
        store = generateParticles(effect, 'canvas', next);
      }
      config = next;
    },

    prepare(time) {
      frame = effect.prepare({ width, height }, time, config);
      halo = haloScale(config.glow, false) * config.size;
      flareHalo = haloScale(config.glow, true) * config.size;
    },

    get count() {
      return store.count;
    },

    get brightness() {
      return config.brightness;
    },

    sample(i, out) {
      return effect.sample(store, i, frame, out);
    },

    hash(i) {
      return store.v[i * 4 + 3]!;
    },

    paint(ctx, p, alpha) {
      const level = p.soft > 0.25 ? (p.soft > 0.75 ? 2 : 1) : 0;
      const { normal, flare } = spritesFor(level);
      if (level) alpha *= softness(level / 2)[1];
      const isFlare = p.flare > 0.5;
      const R = p.radius * (isFlare ? flareHalo : halo);
      const last = store.palette.colors.length - 1;
      const sprite = (isFlare ? flare : normal)[Math.min(last, Math.max(0, Math.round(p.color)))]!;
      // Brightness above 1 is drawn as extra additive passes.
      while (alpha > 0.004) {
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.drawImage(sprite, p.x - R, p.y - R, 2 * R, 2 * R);
        alpha -= 1;
      }
    },

    drawHaze(ctx, time, weight) {
      if (config.haze <= 0 || weight <= 0 || !effect.haze) return;
      hazeSprites ??= buildHazeSprites(store.palette);
      const last = hazeSprites.length - 1;
      for (const b of effect.haze({ width, height }, time, config).slice(0, MAX_HAZE_BLOBS)) {
        ctx.globalAlpha = Math.min(1, b.intensity * config.haze * config.brightness * weight);
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.drawImage(hazeSprites[Math.min(last, Math.max(0, Math.round(b.color)))]!, -b.rx, -b.ry, 2 * b.rx, 2 * b.ry);
        ctx.restore();
      }
    },

    draw(ctx, time, reveal) {
      if (store.count === 0 || width <= 0 || height <= 0 || reveal <= 0) return;
      layer.drawHaze(ctx, time, reveal);
      layer.prepare(time);
      // Optional short trails: the same particle sampled slightly in the past (mirror of WebGL).
      const trail = effect.trail;
      const samples = trail ? Math.max(1, Math.min(trail.canvas ?? 1, trail.count)) : 1;
      const frames = [frame];
      for (let k = 1; k < samples; k++) frames.push(effect.prepare({ width, height }, time - k * trail!.spacing, config));
      for (let i = 0; i < store.count; i++) {
        const weight = reveal < 1 ? dissolveWeight(reveal, layer.hash(i)) : 1;
        for (let k = 0; k < samples; k++) {
          if (!effect.sample(store, i, frames[k], s)) continue;
          let alpha = s.alpha * config.brightness * weight;
          if (k > 0) {
            const kf = 1 - k / trail!.count;
            alpha *= kf * kf * 0.8;
            s.radius *= 0.55 + 0.45 * kf;
          }
          if (alpha < 0.004) continue;
          layer.paint(ctx, s, alpha);
        }
      }
    },

    destroy() {
      sprites = [null, null, null];
      hazeSprites = null;
    },
  };
  return layer;
}

/** Per-particle visibility during a dissolve (mirrored in the WebGL vertex shader). */
export const dissolveWeight = (reveal: number, hash: number): number =>
  Math.min(1, Math.max(0, (reveal - hash * 0.85) / 0.15));

/** Per-particle morph progress: staggered by hash so the morph ripples instead of moving in lockstep. */
export const morphWeight = (progress: number, hash: number): number => {
  const t = Math.min(1, Math.max(0, (progress - hash * 0.4) / 0.6));
  return t * t * (3 - 2 * t);
};

/** Draw a morph between two layers: particle i of `a` travels to particle i of `b`. */
export function drawMorph(ctx: CanvasRenderingContext2D, a: CanvasLayer, b: CanvasLayer, time: number, progress: number): void {
  a.drawHaze(ctx, time, 1 - progress);
  b.drawHaze(ctx, time, progress);
  a.prepare(time);
  b.prepare(time);
  const sa = emptySample();
  const sb = emptySample();
  const m = emptySample();
  const n = Math.max(a.count, b.count);
  for (let i = 0; i < n; i++) {
    const hasA = i < a.count && a.sample(i, sa);
    const hasB = i < b.count && b.sample(i, sb);
    const w = morphWeight(progress, i < a.count ? a.hash(i) : b.hash(i));
    if (hasA && hasB) {
      m.x = sa.x + (sb.x - sa.x) * w;
      m.y = sa.y + (sb.y - sa.y) * w;
      m.radius = sa.radius + (sb.radius - sa.radius) * w;
      m.soft = sa.soft + (sb.soft - sa.soft) * w;
      const alpha = sa.alpha * a.brightness * (1 - w) + sb.alpha * b.brightness * w;
      const target = w < 0.5 ? sa : sb;
      m.color = target.color;
      m.flare = target.flare;
      (w < 0.5 ? a : b).paint(ctx, m, alpha);
    } else if (hasA) {
      a.paint(ctx, sa, sa.alpha * a.brightness * (1 - w));
    } else if (hasB) {
      b.paint(ctx, sb, sb.alpha * b.brightness * w);
    }
  }
}
