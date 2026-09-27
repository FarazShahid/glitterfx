import type { FrameTime, GlitterFXConfig } from '@glitterfx/core';
import type { Object3D } from 'three';

/** One effect's WebGL implementation. The backend owns the renderer, scene and camera. */
export interface WebGLEffect {
  readonly object: Object3D;
  /** Size in CSS px and the capped device pixel ratio. */
  resize(width: number, height: number, pixelRatio: number): void;
  update(config: GlitterFXConfig): void;
  /** Per-frame work must stay O(1) in JS: set uniforms, let shaders do the rest. */
  frame(frame: FrameTime): void;
  dispose(): void;
}
