import { prefersReducedMotion, selectBackend, registeredBackends, type BackendDescriptor, type BackendInstance } from './backend.js';
import {
  normalizeConfig,
  PIXEL_RATIO_CAP,
  type GlitterFXConfig,
  type GlitterFXOptions,
  type GlitterFXUpdate,
  type ReducedMotion,
  type RendererId,
  type RuntimeOptionKey,
} from './config.js';

/** Longest frame step in seconds. Prevents simulation jumps after a hidden tab resumes. */
const MAX_DELTA = 0.1;

const SURFACE_STYLE: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  inset: '0',
  width: '100%',
  height: '100%',
  display: 'block',
  pointerEvents: 'none',
  // Behind the container's own content; `isolation` on the container keeps it above its background.
  zIndex: '-1',
};

export type TransitionType = 'crossfade' | 'morph' | 'dissolve';

export interface TransitionOptions {
  /** Milliseconds. Default 1200. */
  duration?: number;
  /** Default 'crossfade'. 'morph'/'dissolve' fall back to crossfade when the backend cannot do them. */
  type?: TransitionType;
}

interface ActiveTransition {
  kind: 'instance' | 'crossfade';
  /** Crossfade only: the instance fading in. */
  incoming: BackendInstance | null;
  backend: BackendDescriptor;
  options: Omit<GlitterFXOptions, RuntimeOptionKey>;
  config: GlitterFXConfig;
  duration: number;
  elapsed: number;
  resolve: (completed: boolean) => void;
}

const ease = (t: number): number => t * t * (3 - 2 * t);

export class GlitterFX {
  readonly container: HTMLElement;

  #options: Omit<GlitterFXOptions, RuntimeOptionKey>;
  #config: GlitterFXConfig;
  /** Explicit list, or undefined to read the global registry at selection time. */
  readonly #backends: readonly BackendDescriptor[] | undefined;
  #backend: BackendDescriptor;
  #instance: BackendInstance | null = null;
  #transition: ActiveTransition | null = null;

  /** User intent (start/stop). The loop also needs visibility and motion permission. */
  #running = false;
  #destroyed = false;
  #looping = false;
  #hidden = false;
  #offscreen = false;
  #reducedMotion: ReducedMotion;
  #pauseWhenHidden: boolean;
  #cleanups: (() => void)[] = [];
  #raf = 0;
  #lastNow = -1;
  #time = 0;
  #size = { width: -1, height: -1, pixelRatio: -1 };
  #observer: ResizeObserver | null = null;
  #restoreContainer: (() => void) | null = null;

  constructor(container: HTMLElement, options: GlitterFXOptions) {
    const { backends, pauseWhenHidden, reducedMotion, ...rest } = options;
    this.container = container;
    this.#options = rest;
    this.#config = normalizeConfig(rest);
    this.#backends = backends;
    this.#pauseWhenHidden = pauseWhenHidden ?? true;
    this.#reducedMotion = reducedMotion ?? 'auto';
    // Select and create before touching the DOM so a failure leaves the container untouched.
    this.#backend = selectBackend(this.#config.renderer, this.#available());
    const instance = this.#backend.create(this.#config);

    this.#restoreContainer = prepareContainer(container);
    this.#attach(instance);
    if (typeof ResizeObserver !== 'undefined') {
      this.#observer = new ResizeObserver(() => this.resize());
      this.#observer.observe(container);
    }
    this.#watchEnvironment();
    this.start();
  }

  /** Backend actually in use (resolved from `auto`). */
  get renderer(): RendererId {
    return this.#backend.id;
  }

  get config(): GlitterFXConfig {
    return this.#config;
  }

  get running(): boolean {
    return this.#running;
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  get transitioning(): boolean {
    return this.#transition !== null;
  }

  /** True while frames are actually being produced (running, visible, motion allowed). */
  get animating(): boolean {
    return this.#looping;
  }

  start(): void {
    if (this.#destroyed || this.#running) return;
    this.#running = true;
    this.#syncLoop();
  }

  stop(): void {
    if (!this.#running) return;
    this.#running = false;
    this.#syncLoop();
  }

  #motionAllowed(): boolean {
    return this.#reducedMotion === 'ignore' || (this.#reducedMotion === 'auto' && !prefersReducedMotion());
  }

  /** Start or stop the frame loop to match intent, visibility and motion preference. */
  #syncLoop(): void {
    const paused = this.#pauseWhenHidden && (this.#hidden || this.#offscreen);
    const loop = this.#running && !this.#destroyed && !paused && this.#motionAllowed();
    if (loop !== this.#looping) {
      this.#looping = loop;
      if (loop) {
        this.#lastNow = -1;
        this.#raf = requestAnimationFrame(this.#tick);
      } else {
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
      }
    }
    if (!loop) this.#renderStill();
  }

  /** Without motion, draw a single frame so the effect still shows (reduced motion, config changes). */
  #renderStill(): void {
    if (this.#destroyed || this.#looping || this.#motionAllowed() || !this.#instance) return;
    this.#finishTransition(true);
    this.#instance.frame({ time: this.#time, delta: 0 });
  }

  #watchEnvironment(): void {
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      const onVisibility = () => {
        this.#hidden = document.visibilityState === 'hidden';
        this.#syncLoop();
      };
      document.addEventListener('visibilitychange', onVisibility);
      this.#cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));
      this.#hidden = document.visibilityState === 'hidden';
    }
    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        this.#offscreen = !entry.isIntersecting;
        this.#syncLoop();
      });
      io.observe(this.container);
      this.#cleanups.push(() => io.disconnect());
    }
    if (typeof matchMedia === 'function') {
      const mq = matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = () => {
        this.#syncLoop();
        this.#renderStill();
      };
      mq.addEventListener?.('change', onChange);
      this.#cleanups.push(() => mq.removeEventListener?.('change', onChange));
    }
  }

  /** Re-measure the container. Called automatically when a ResizeObserver is available. */
  resize(): void {
    if (this.#destroyed || !this.#instance) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = typeof devicePixelRatio === 'number' && devicePixelRatio > 0 ? devicePixelRatio : 1;
    const next = {
      width: rect.width,
      height: rect.height,
      pixelRatio: Math.min(dpr, PIXEL_RATIO_CAP[this.#config.quality]),
    };
    const prev = this.#size;
    if (next.width === prev.width && next.height === prev.height && next.pixelRatio === prev.pixelRatio) return;
    this.#size = next;
    this.#instance.resize(next);
    this.#transition?.incoming?.resize(next);
    this.#renderStill();
  }

  /** Change options immediately. A running transition is completed first. */
  update(changes: GlitterFXUpdate): void {
    if (this.#destroyed) return;
    this.#finishTransition(true);
    const options = { ...this.#options, ...changes };
    const config = normalizeConfig(options);
    const prev = this.#config;

    if (config.renderer !== prev.renderer || config.effect !== prev.effect) {
      const backend = selectBackend(config.renderer, this.#available());
      // Rebuild only when the resolved backend or the effect actually changes
      // (e.g. 'webgl' -> 'auto' resolving to webgl keeps the live instance).
      if (backend !== this.#backend || config.effect !== prev.effect) {
        // Create first: if it throws, the current instance keeps running untouched.
        const instance = backend.create(config);
        this.#options = options;
        this.#config = config;
        this.#backend = backend;
        this.#detach(this.#instance);
        this.#attach(instance);
        this.#renderStill();
        return;
      }
    }

    this.#options = options;
    this.#config = config;
    if (config.quality !== prev.quality) this.resize();
    this.#instance?.update(config);
    this.#setOpacity(this.#instance, config.opacity);
    this.#renderStill();
  }

  /**
   * Animate to another effect (or any options). Resolves true when it completes, false when it is
   * cancelled or superseded. Starting a new transition completes the running one first.
   */
  transitionTo(target: string | GlitterFXUpdate, options: TransitionOptions = {}): Promise<boolean> {
    if (this.#destroyed || !this.#instance) return Promise.resolve(false);
    this.#finishTransition(true);
    const changes: GlitterFXUpdate = typeof target === 'string' ? { effect: target } : target;
    const nextOptions = { ...this.#options, ...changes };
    const config = normalizeConfig(nextOptions);
    const backend = selectBackend(config.renderer, this.#available());
    // Without motion there is nothing to animate: switch immediately.
    const duration = this.#motionAllowed() ? Math.max(0, options.duration ?? 1200) : 0;
    const type = options.type ?? 'crossfade';

    return new Promise<boolean>((resolve) => {
      const base = { backend, options: nextOptions, config, duration, elapsed: 0, resolve };
      const instance = this.#instance!;
      if (type !== 'crossfade' && backend === this.#backend && instance.beginTransition?.(config, type)) {
        this.#transition = { ...base, kind: 'instance', incoming: null };
      } else {
        const incoming = backend.create(config);
        this.#mountSurface(incoming, instance.element.nextSibling);
        incoming.element.style.opacity = '0';
        incoming.resize(this.#size);
        this.#transition = { ...base, kind: 'crossfade', incoming };
      }
      if (duration === 0) {
        this.#finishTransition(true);
        this.#renderStill();
      }
    });
  }

  /** Stop a running transition and return to where it started. */
  cancelTransition(): void {
    this.#finishTransition(false);
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#running = false;
    this.#destroyed = true;
    this.#looping = false;
    cancelAnimationFrame(this.#raf);
    for (const cleanup of this.#cleanups.splice(0)) cleanup();
    this.#finishTransition(false);
    this.#observer?.disconnect();
    this.#observer = null;
    this.#detach(this.#instance);
    this.#restoreContainer?.();
    this.#restoreContainer = null;
  }

  #available(): readonly BackendDescriptor[] {
    return this.#backends ?? registeredBackends();
  }

  #mountSurface(instance: BackendInstance, before: Node | null): void {
    Object.assign(instance.element.style, SURFACE_STYLE);
    instance.element.setAttribute('aria-hidden', 'true');
    this.container.insertBefore(instance.element, before);
  }

  /** Layer opacity lives on the surface element: same result for every backend and effect, no render cost. */
  #setOpacity(instance: BackendInstance | null | undefined, value: number): void {
    if (instance) instance.element.style.opacity = value >= 1 ? '' : String(Math.max(0, value));
  }

  #attach(instance: BackendInstance): void {
    this.#mountSurface(instance, this.container.firstChild);
    this.#setOpacity(instance, this.#config.opacity);
    this.#instance = instance;
    this.#size = { width: -1, height: -1, pixelRatio: -1 };
    this.resize();
  }

  #detach(instance: BackendInstance | null): void {
    if (!instance) return;
    if (instance === this.#instance) this.#instance = null;
    instance.destroy();
    instance.element.remove();
  }

  #applyTransition(progress: number): void {
    const t = this.#transition;
    if (!t) return;
    const e = ease(progress);
    const from = this.#config.opacity;
    const to = t.config.opacity;
    if (t.kind === 'instance') {
      this.#instance?.setTransition?.(e);
      this.#setOpacity(this.#instance, from + (to - from) * e);
    } else if (t.incoming && this.#instance) {
      this.#setOpacity(this.#instance, from * (1 - e));
      this.#setOpacity(t.incoming, to * e);
    }
  }

  /** Complete (commit) or revert the running transition. */
  #finishTransition(commit: boolean): void {
    const t = this.#transition;
    if (!t) return;
    this.#transition = null;
    if (t.kind === 'instance') {
      this.#instance?.endTransition?.(commit);
    } else if (t.incoming) {
      if (commit) {
        const outgoing = this.#instance;
        this.#setOpacity(t.incoming, t.config.opacity);
        this.#instance = t.incoming;
        this.#detach(outgoing);
      } else {
        this.#detach(t.incoming);
      }
    }
    if (commit) {
      const qualityChanged = t.config.quality !== this.#config.quality;
      this.#options = t.options;
      this.#config = t.config;
      this.#backend = t.backend;
      if (qualityChanged) this.resize();
    }
    this.#setOpacity(this.#instance, this.#config.opacity);
    t.resolve(commit && t.elapsed >= t.duration);
  }

  #tick = (now: number): void => {
    if (!this.#looping || !this.#instance) return;
    // Real elapsed time; the clock restarts when the loop resumes, so hidden time never counts.
    const real = this.#lastNow < 0 ? 0 : Math.max(0, (now - this.#lastNow) / 1000);
    const raw = Math.min(real, MAX_DELTA);
    this.#lastNow = now;
    const delta = raw * this.#config.speed;
    this.#time += delta;

    const t = this.#transition;
    if (t) {
      // Transition progress follows the real clock (not `speed`, not the simulation clamp)
      // so slow devices still finish on time; it freezes while stopped or hidden.
      t.elapsed += real * 1000;
      const progress = t.duration === 0 ? 1 : Math.min(1, t.elapsed / t.duration);
      this.#applyTransition(progress);
      if (progress >= 1) this.#finishTransition(true);
    }

    const frame = { time: this.#time, delta };
    this.#instance?.frame(frame);
    this.#transition?.incoming?.frame(frame);
    this.#raf = requestAnimationFrame(this.#tick);
  };
}

/** Make the container a positioned, isolated stacking context. Returns a restore function. */
function prepareContainer(container: HTMLElement): () => void {
  const { position, isolation } = container.style;
  const computed = getComputedStyle(container).position;
  // '' covers environments without a default stylesheet, where static is implied.
  if (computed === 'static' || computed === '') container.style.position = 'relative';
  container.style.isolation = 'isolate';
  return () => {
    container.style.position = position;
    container.style.isolation = isolation;
  };
}
