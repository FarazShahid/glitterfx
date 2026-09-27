import type { BackendDescriptor, BackendInstance, GlitterFXConfig, InstanceTransition, SurfaceSize } from '@glitterfx/core';
import { particleEffects } from '@glitterfx/effects';
import { Camera, REVISION, Scene, WebGLRenderer } from 'three';
import type { Camera as ThreeCamera } from 'three';
import { glslFor } from './effects/index.js';
import { createMorphLayer, createWebGLParticles, type MorphLayer, type WebGLParticles } from './particles.js';

/** Three.js revision this backend was built against. Three stays inside this package. */
export const THREE_REVISION: string = REVISION;

function createLayer(config: GlitterFXConfig, maxPointSize: number): WebGLParticles {
  const effect = particleEffects[config.effect];
  const code = effect && glslFor(effect);
  if (!effect || !code) throw new Error(`GlitterFX webgl: effect "${config.effect}" is not implemented.`);
  return createWebGLParticles(effect as never, code.glsl, config, maxPointSize, code.defines);
}

export interface WebGLBackendOptions {
  /**
   * Optional post-processing hook, off by default. Called every frame; return true if it rendered
   * the frame itself (e.g. through an EffectComposer), false to let the backend render normally.
   */
  postprocess?: (ctx: { renderer: WebGLRenderer; scene: Scene; camera: ThreeCamera; time: number; width: number; height: number }) => boolean;
}

/** Build a WebGL backend. `webglBackend` is the default instance without post-processing. */
export function createWebGLBackend(options: WebGLBackendOptions = {}): BackendDescriptor {
  return {
  id: 'webgl',

  isSupported() {
    if (typeof document === 'undefined') return false;
    try {
      // Current Three.js requires WebGL2; release the probe context immediately.
      const gl = document.createElement('canvas').getContext('webgl2');
      if (gl === null) return false;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return true;
    } catch {
      return false;
    }
  },

  create(config): BackendInstance {
    const effect = particleEffects[config.effect];
    if (!effect || !glslFor(effect)) throw new Error(`GlitterFX webgl: effect "${config.effect}" is not implemented.`);
    const renderer = new WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true });
    renderer.setClearColor(0x000000, 0);
    const gl = renderer.getContext();
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array | null;
    const maxPointSize = range?.[1] ?? 64;

    const scene = new Scene();
    // Shaders write clip space directly; the camera only satisfies renderer.render().
    const camera = new Camera();
    let layer: WebGLParticles | null = createLayer(config, maxPointSize);
    let next: WebGLParticles | null = null;
    /** Config the instance shows (and the one a running transition targets), for rebuilds. */
    let current = config;
    let target: GlitterFXConfig | null = null;
    let lost = false;
    let morph: MorphLayer | null = null;
    let mode: InstanceTransition = 'dissolve';
    let progress = 0;
    let size: SurfaceSize = { width: 1, height: 1, pixelRatio: 1 };
    scene.add(layer.object);

    function clearTransition(): void {
      if (morph) {
        scene.remove(morph.object);
        morph.dispose();
        morph = null;
      }
      if (next) {
        scene.remove(next.object);
        next.dispose();
        next = null;
      }
    }

    /** Recreate GPU-side objects after a context restore (data regenerates deterministically). */
    function rebuild(): void {
      clearTransition();
      if (layer) {
        scene.remove(layer.object);
        layer.dispose();
      }
      layer = createLayer(current, maxPointSize);
      layer.resize(size.width, size.height, size.pixelRatio);
      scene.add(layer.object);
    }

    const canvas = renderer.domElement;
    const onLost = (event: Event) => {
      // Tell the browser we will handle restoration; render nothing meanwhile.
      event.preventDefault();
      lost = true;
    };
    const onRestored = () => {
      lost = false;
      rebuild();
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    return {
      element: canvas,
      resize(s: SurfaceSize) {
        size = s;
        renderer.setPixelRatio(s.pixelRatio);
        // false: core owns CSS sizing of the surface.
        renderer.setSize(s.width, s.height, false);
        layer?.resize(s.width, s.height, s.pixelRatio);
        next?.resize(s.width, s.height, s.pixelRatio);
        morph?.resize(s.width, s.height, s.pixelRatio);
      },
      update(c) {
        current = c;
        layer?.update(c);
      },
      frame({ time }) {
        if (!layer || lost) return;
        layer.frame(time);
        next?.frame(time);
        morph?.frame(time, progress);
        if (!options.postprocess?.({ renderer, scene, camera, time, width: size.width, height: size.height })) {
          renderer.render(scene, camera);
        }
      },
      beginTransition(c, type) {
        if (!layer || lost) return false;
        clearTransition();
        target = c;
        mode = type;
        progress = 0;
        next = createLayer(c, maxPointSize);
        next.resize(size.width, size.height, size.pixelRatio);
        if (mode === 'morph') {
          morph = createMorphLayer(layer, next, maxPointSize);
          morph.resize(size.width, size.height, size.pixelRatio);
          // Morph owns the particles; each layer keeps drawing only its haze.
          layer.points.visible = false;
          next.points.visible = false;
          next.setHazeWeight(0);
          scene.add(next.object, morph.object);
        } else {
          next.setReveal(0);
          scene.add(next.object);
        }
        return true;
      },
      setTransition(p) {
        progress = p;
        layer?.setHazeWeight(1 - p);
        next?.setHazeWeight(p);
        if (mode === 'dissolve') {
          layer?.setReveal(1 - p);
          next?.setReveal(p);
        }
      },
      endTransition(commit) {
        const committed = commit ? target : null;
        target = null;
        if (committed) current = committed;
        if (!layer || !next) {
          // The transition was dropped by a context restore: show the committed config.
          if (committed && !lost) rebuild();
          return;
        }
        if (commit) {
          // Keep `next` alive as the new layer; only the morph helper and old layer go.
          const incoming = next;
          next = null;
          clearTransition();
          scene.remove(layer.object);
          layer.dispose();
          layer = incoming;
          if (!layer.object.parent) scene.add(layer.object);
        } else {
          clearTransition();
        }
        layer.setReveal(1);
        layer.setHazeWeight(1);
        layer.points.visible = true;
      },
      destroy() {
        canvas.removeEventListener('webglcontextlost', onLost);
        canvas.removeEventListener('webglcontextrestored', onRestored);
        clearTransition();
        layer?.dispose();
        layer = null;
        renderer.dispose();
        renderer.forceContextLoss();
      },
    };
  },
  };
}

export const webglBackend: BackendDescriptor = createWebGLBackend();
