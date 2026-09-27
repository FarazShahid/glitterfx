import type { BackendDescriptor } from './backend.js';

export type RendererId = 'canvas' | 'webgl';
export type RendererPreference = RendererId | 'auto';
export type Quality = 'eco' | 'balanced' | 'high';

/** What users pass. Everything except `effect` is optional. */
/** A renderer, `auto`, or an ordered fallback list such as ['webgl', 'canvas']. */
export type RendererOption = RendererPreference | readonly RendererId[];

/** 'auto' respects prefers-reduced-motion (static frame); 'static' always; 'ignore' never. */
export type ReducedMotion = 'auto' | 'static' | 'ignore';

export interface GlitterFXOptions {
  effect: string;
  renderer?: RendererOption;
  quality?: Quality;
  /** Particle amount multiplier. 0..2, default 1. */
  density?: number;
  /** Simulation time multiplier. 0..4, default 1. 0 freezes motion. */
  speed?: number;
  /** Particle size multiplier. 0.1..4, default 1. */
  size?: number;
  /** Brightness multiplier. 0..2, default 1. */
  brightness?: number;
  /** Glow amount. 0..1, default 0.5. */
  glow?: number;
  /** Soft atmospheric haze behind particles. 0..1, default 0 (off, no cost). */
  haze?: number;
  /** Opacity of the whole effect layer. 0..1, default 1. Applies to every effect and renderer. */
  opacity?: number;
  /**
   * Effect-specific parameters, e.g. `{ arms: 4 }` for galaxy. Each effect declares its own
   * (see `effects[i].params`); unknown keys are ignored, values are clamped by the effect.
   * An update replaces the whole object.
   */
  params?: Readonly<Record<string, number>>;
  /** Pointer interaction, applied to every effect and renderer. Default off. */
  interaction?: InteractionOptions;
  /** Global flow along x/y/z and time direction, applied to every effect and renderer. Default still. */
  motion?: MotionOptions;
  /** Palette name. Undefined means the effect's own default. */
  palette?: string;
  /** Deterministic seed (uint32). Default 1. */
  seed?: number;
  /** Backends to choose from. Defaults to the globally registered backends. */
  backends?: readonly BackendDescriptor[];
  /** Pause while the tab is hidden or the container is offscreen. Default true. */
  pauseWhenHidden?: boolean;
  /** Default 'auto'. */
  reducedMotion?: ReducedMotion;
}

export interface MotionOptions {
  /** Horizontal flow, view heights per second (+ right). -1..1, default 0. */
  x?: number;
  /** Vertical flow, view heights per second (+ down). -1..1, default 0. */
  y?: number;
  /** Depth flow (+ towards the viewer, particles stream outward; - away). -1..1, default 0. */
  z?: number;
  /** Run the effect backwards in time. Default false. */
  reverse?: boolean;
}

export type PointerMode = 'none' | 'repel' | 'attract' | 'vortex';

export interface InteractionOptions {
  /** Default 'none'. */
  pointer?: PointerMode;
  /** Reach of the influence in CSS px. 10..1000, default 140. */
  radius?: number;
  /** 0..2, default 0.8. */
  strength?: number;
}

/** Options that only affect how an instance runs, not what it draws. */
export type RuntimeOptionKey = 'backends' | 'pauseWhenHidden' | 'reducedMotion';

/** Options that can change on a running instance. */
export type GlitterFXUpdate = Partial<Omit<GlitterFXOptions, RuntimeOptionKey>>;

/** Normalized configuration every backend receives. Same shape for all renderers. */
export interface GlitterFXConfig {
  readonly effect: string;
  readonly renderer: RendererOption;
  readonly quality: Quality;
  readonly density: number;
  readonly speed: number;
  readonly size: number;
  readonly brightness: number;
  readonly glow: number;
  readonly haze: number;
  readonly opacity: number;
  /** Frozen copy with finite numbers only. */
  readonly params: Readonly<Record<string, number>>;
  readonly interaction: Readonly<Required<InteractionOptions>>;
  readonly motion: Readonly<Required<MotionOptions>>;
  readonly palette: string | undefined;
  readonly seed: number;
}

const RENDERERS: readonly RendererPreference[] = ['auto', 'canvas', 'webgl'];
const RENDERER_IDS: readonly RendererId[] = ['canvas', 'webgl'];
const QUALITIES: readonly Quality[] = ['eco', 'balanced', 'high'];

type NumericKey = 'density' | 'speed' | 'size' | 'brightness' | 'glow' | 'haze' | 'opacity';

/** [min, max, default] per numeric option. */
export const NUMERIC_RANGES: Readonly<Record<NumericKey, readonly [number, number, number]>> = {
  density: [0, 2, 1],
  speed: [0, 4, 1],
  size: [0.1, 4, 1],
  brightness: [0, 2, 1],
  glow: [0, 1, 0.5],
  haze: [0, 1, 0],
  opacity: [0, 1, 1],
};

/** Device pixel ratio ceiling per quality. Shared by every backend. */
export const PIXEL_RATIO_CAP: Readonly<Record<Quality, number>> = {
  eco: 1,
  balanced: 1.5,
  high: 2,
};

function num(key: NumericKey, value: number | undefined): number {
  const [min, max, fallback] = NUMERIC_RANGES[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function oneOf<T extends string>(name: string, value: T | undefined, allowed: readonly T[], fallback: T): T {
  if (value === undefined) return fallback;
  if (!allowed.includes(value)) {
    throw new TypeError(`GlitterFX: invalid ${name} "${String(value)}". Expected one of: ${allowed.join(', ')}.`);
  }
  return value;
}

function renderer(value: RendererOption | undefined): RendererOption {
  if (Array.isArray(value)) {
    if (value.length === 0) throw new TypeError('GlitterFX: renderer list must not be empty.');
    for (const id of value) oneOf('renderer', id, RENDERER_IDS, 'canvas');
    return Object.freeze([...value]);
  }
  return oneOf('renderer', value as RendererPreference | undefined, RENDERERS, 'auto');
}

const NO_PARAMS: Readonly<Record<string, number>> = Object.freeze({});

function params(value: Readonly<Record<string, number>> | undefined): Readonly<Record<string, number>> {
  if (value === undefined) return NO_PARAMS;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TypeError('GlitterFX: "params" must be an object of numbers.');
  const out: Record<string, number> = {};
  for (const [key, v] of Object.entries(value)) {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`GlitterFX: params.${key} must be a finite number.`);
    out[key] = v;
  }
  return Object.freeze(out);
}

const POINTER_MODES: readonly PointerMode[] = ['none', 'repel', 'attract', 'vortex'];
const NO_INTERACTION = Object.freeze({ pointer: 'none', radius: 140, strength: 0.8 } as const);

function interaction(value: InteractionOptions | undefined): Readonly<Required<InteractionOptions>> {
  if (value === undefined) return NO_INTERACTION;
  if (typeof value !== 'object' || value === null) throw new TypeError('GlitterFX: "interaction" must be an object.');
  const bounded = (key: 'radius' | 'strength', v: number | undefined, min: number, max: number, fallback: number) => {
    if (v === undefined) return fallback;
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`GlitterFX: interaction.${key} must be a finite number.`);
    return Math.min(max, Math.max(min, v));
  };
  return Object.freeze({
    pointer: oneOf('interaction.pointer', value.pointer, POINTER_MODES, 'none'),
    radius: bounded('radius', value.radius, 10, 1000, 140),
    strength: bounded('strength', value.strength, 0, 2, 0.8),
  });
}

const STILL = Object.freeze({ x: 0, y: 0, z: 0, reverse: false });

function motion(value: MotionOptions | undefined): Readonly<Required<MotionOptions>> {
  if (value === undefined) return STILL;
  if (typeof value !== 'object' || value === null) throw new TypeError('GlitterFX: "motion" must be an object.');
  const flow = (key: 'x' | 'y' | 'z') => {
    const v = value[key];
    if (v === undefined) return 0;
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`GlitterFX: motion.${key} must be a finite number.`);
    return Math.min(1, Math.max(-1, v));
  };
  if (value.reverse !== undefined && typeof value.reverse !== 'boolean') throw new TypeError('GlitterFX: motion.reverse must be a boolean.');
  return Object.freeze({ x: flow('x'), y: flow('y'), z: flow('z'), reverse: value.reverse ?? false });
}

export function normalizeConfig(options: Omit<GlitterFXOptions, RuntimeOptionKey>): GlitterFXConfig {
  if (typeof options.effect !== 'string' || options.effect.length === 0) {
    throw new TypeError('GlitterFX: "effect" is required.');
  }
  const seed = options.seed;
  return {
    effect: options.effect,
    renderer: renderer(options.renderer),
    quality: oneOf('quality', options.quality, QUALITIES, 'balanced'),
    density: num('density', options.density),
    speed: num('speed', options.speed),
    size: num('size', options.size),
    brightness: num('brightness', options.brightness),
    glow: num('glow', options.glow),
    haze: num('haze', options.haze),
    opacity: num('opacity', options.opacity),
    params: params(options.params),
    interaction: interaction(options.interaction),
    motion: motion(options.motion),
    palette: options.palette,
    seed: typeof seed === 'number' && Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 1,
  };
}
