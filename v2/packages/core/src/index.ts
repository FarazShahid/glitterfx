/**
 * @glitterfx/core
 *
 * Renderer-independent public API. This package must never import Three.js,
 * a backend package, React or WebGPU types. Backends depend on core, not the reverse.
 */

export const VERSION = '2.0.0-alpha.0';

export { GlitterFX, type TransitionOptions, type TransitionType } from './glitterfx.js';
export {
  normalizeConfig,
  NUMERIC_RANGES,
  PIXEL_RATIO_CAP,
  type GlitterFXConfig,
  type GlitterFXOptions,
  type GlitterFXUpdate,
  type Quality,
  type RendererId,
  type RendererPreference,
  type RendererOption,
  type ReducedMotion,
} from './config.js';
export {
  AUTO_ORDER,
  capabilities,
  prefersReducedMotion,
  type Capabilities,
  registerBackend,
  registeredBackends,
  unregisterBackend,
  selectBackend,
  type BackendDescriptor,
  type BackendInstance,
  type FrameTime,
  type InstanceTransition,
  type SurfaceSize,
} from './backend.js';
