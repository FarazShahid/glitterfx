import type { BackendDescriptor, BackendInstance, GlitterFXConfig, InstanceTransition, SurfaceSize } from '@glitterfx/core';
import { particleEffects } from '@glitterfx/effects';
import { createCanvasLayer, drawMorph, type CanvasLayer } from './particles.js';

function createLayer(config: GlitterFXConfig): CanvasLayer {
  const effect = particleEffects[config.effect];
  if (!effect) throw new Error(`GlitterFX canvas: effect "${config.effect}" is not implemented.`);
  return createCanvasLayer(effect as never, config);
}

export const canvasBackend: BackendDescriptor = {
  id: 'canvas',

  isSupported() {
    if (typeof document === 'undefined') return false;
    try {
      return document.createElement('canvas').getContext('2d') !== null;
    } catch {
      return false;
    }
  },

  create(config): BackendInstance {
    if (!particleEffects[config.effect]) throw new Error(`GlitterFX canvas: effect "${config.effect}" is not implemented.`);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('GlitterFX canvas: 2D context unavailable.');
    let layer: CanvasLayer | null = createLayer(config);
    let next: CanvasLayer | null = null;
    let mode: InstanceTransition = 'dissolve';
    let progress = 0;
    let size = { width: 0, height: 0 };

    return {
      element: canvas,
      resize(s: SurfaceSize) {
        size = s;
        canvas.width = Math.max(1, Math.round(s.width * s.pixelRatio));
        canvas.height = Math.max(1, Math.round(s.height * s.pixelRatio));
        // Draw in CSS pixels; the transform maps them to the backing store.
        ctx.setTransform(s.pixelRatio, 0, 0, s.pixelRatio, 0, 0);
        layer?.resize(s.width, s.height);
        next?.resize(s.width, s.height);
      },
      update(c) {
        layer?.update(c);
      },
      frame({ time }) {
        if (!layer) return;
        ctx.clearRect(0, 0, size.width, size.height);
        ctx.globalCompositeOperation = 'lighter';
        if (!next) {
          layer.draw(ctx, time, 1);
        } else if (mode === 'dissolve') {
          layer.draw(ctx, time, 1 - progress);
          next.draw(ctx, time, progress);
        } else {
          drawMorph(ctx, layer, next, time, progress);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      },
      beginTransition(c, type) {
        next?.destroy();
        next = createLayer(c);
        next.resize(size.width, size.height);
        mode = type;
        progress = 0;
        return true;
      },
      setTransition(p) {
        progress = p;
      },
      endTransition(commit) {
        if (!next) return;
        if (commit) {
          layer?.destroy();
          layer = next;
        } else {
          next.destroy();
        }
        next = null;
      },
      destroy() {
        layer?.destroy();
        next?.destroy();
        layer = next = null;
        // Release the backing store immediately instead of waiting for GC.
        canvas.width = 0;
        canvas.height = 0;
      },
    };
  },
};
