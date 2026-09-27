import type { GlitterFXConfig, RendererId, RendererOption } from './config.js';

export interface SurfaceSize {
  /** CSS pixels. */
  readonly width: number;
  readonly height: number;
  /** Device pixel ratio already capped by quality. */
  readonly pixelRatio: number;
}

export interface FrameTime {
  /** Effect time in seconds: accumulated `delta`, scaled by `speed`, frozen while stopped. */
  readonly time: number;
  /** Scaled seconds since the previous frame, clamped to avoid jumps after tab switches. */
  readonly delta: number;
}

/** A live renderer bound to one GlitterFX instance. Core owns mounting, sizing and the frame loop. */
export interface BackendInstance {
  /** Surface core mounts inside the container. */
  readonly element: HTMLCanvasElement;
  resize(size: SurfaceSize): void;
  update(config: GlitterFXConfig): void;
  frame(time: FrameTime): void;
  /** Release GPU/CPU resources. Core removes `element` afterwards. */
  destroy(): void;
  /**
   * Optional in-instance transition to `next` (same backend). Return false if the type is
   * unsupported; core then crossfades two instances instead.
   */
  beginTransition?(next: GlitterFXConfig, type: InstanceTransition): boolean;
  /** Eased progress in [0, 1]. */
  setTransition?(progress: number): void;
  /** commit = true: render only `next` from now on. false: drop `next`, keep the original. */
  endTransition?(commit: boolean): void;
}

export type InstanceTransition = 'morph' | 'dissolve';

/** What a backend package exports. Core never imports a backend; backends import core. */
export interface BackendDescriptor {
  readonly id: RendererId;
  /** Cheap capability probe. Must not throw and must not hold on to resources. */
  isSupported(): boolean;
  create(config: GlitterFXConfig): BackendInstance;
}

/** `auto` prefers the highest-fidelity supported backend. */
export const AUTO_ORDER: readonly RendererId[] = ['webgl', 'canvas'];

const registry = new Map<RendererId, BackendDescriptor>();

/** Make a backend available to every instance that does not pass its own `backends`. */
export function registerBackend(backend: BackendDescriptor): void {
  registry.set(backend.id, backend);
}

export function unregisterBackend(id: RendererId): void {
  registry.delete(id);
}

export function registeredBackends(): BackendDescriptor[] {
  return [...registry.values()];
}

export function selectBackend(
  preference: RendererOption,
  backends: readonly BackendDescriptor[],
): BackendDescriptor {
  if (Array.isArray(preference)) {
    // Ordered fallback: first registered and supported renderer wins.
    for (const id of preference as readonly RendererId[]) {
      const backend = backends.find((b) => b.id === id);
      if (backend?.isSupported()) return backend;
    }
    throw new Error(`GlitterFX: none of the renderers [${preference.join(', ')}] is registered and supported here.`);
  }
  if (preference !== 'auto') {
    const backend = backends.find((b) => b.id === preference);
    if (!backend) {
      throw new Error(
        `GlitterFX: renderer "${preference}" is not registered. Import it and call registerBackend(), or pass it in "backends".`,
      );
    }
    if (!backend.isSupported()) {
      throw new Error(`GlitterFX: renderer "${preference}" is not supported in this environment.`);
    }
    return backend;
  }

  for (const id of AUTO_ORDER) {
    const backend = backends.find((b) => b.id === id);
    if (backend?.isSupported()) return backend;
  }
  const ids = backends.map((b) => b.id).join(', ') || 'none';
  throw new Error(`GlitterFX: no supported renderer for "auto" (registered: ${ids}).`);
}

export interface Capabilities {
  /** Per renderer: registered and supported in this environment. */
  readonly renderers: Readonly<Record<RendererId, boolean>>;
  /** What `auto` would pick, or null. */
  readonly auto: RendererId | null;
  readonly reducedMotion: boolean;
}

/** Inspect what this environment can run with the given (or registered) backends. */
export function capabilities(backends: readonly BackendDescriptor[] = registeredBackends()): Capabilities {
  const supported = (id: RendererId) => backends.some((b) => b.id === id && b.isSupported());
  let auto: RendererId | null = null;
  try {
    auto = selectBackend('auto', backends).id;
  } catch {
    auto = null;
  }
  return {
    renderers: { canvas: supported('canvas'), webgl: supported('webgl') },
    auto,
    reducedMotion: prefersReducedMotion(),
  };
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
