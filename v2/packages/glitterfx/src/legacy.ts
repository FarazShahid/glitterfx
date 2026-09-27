/**
 * V1 compatibility facade backed by the V2 engine.
 *
 * New applications should import from "glitterfx". This entry exists so existing V1-shaped
 * integrations can migrate package/runtime delivery before rewriting their configuration.
 *
 * For exact historical V1 behavior (including registerEffect/registerPalette and V1 blur semantics),
 * the package also ships dist/legacy/glitterfx.v1.js, which is the original classic browser runtime.
 */
import {
  GlitterFX as EngineGlitterFX,
  registerBackend,
  type GlitterFXConfig,
  type GlitterFXUpdate,
  type InteractionOptions,
  type MotionOptions,
  type Quality,
  type RendererOption,
} from '@glitterfx/core';
import { canvasBackend } from '@glitterfx/backend-canvas';
import { webglBackend } from '@glitterfx/backend-webgl';
import { effects, palettes, V1_ALIASES, type Palette } from '@glitterfx/effects';

registerBackend(canvasBackend);
registerBackend(webglBackend);

export type LegacyBlurMode = 'none' | 'uniform' | 'lens' | 'motion' | 'center-focus' | 'vignette-blur';

export interface LegacyGlitterFXConfig {
  effect?: string;
  palette?: string | readonly string[];
  weights?: readonly number[];
  size?: number;
  density?: number;
  brightness?: number;
  speed?: number;
  blur?: number;
  blurMode?: LegacyBlurMode;
  haze?: number;
  hazeColor?: string;
  background?: string;

  // V2 options are accepted too, making gradual migrations possible.
  renderer?: RendererOption;
  quality?: Quality;
  glow?: number;
  opacity?: number;
  params?: Readonly<Record<string, number>>;
  interaction?: InteractionOptions;
  motion?: MotionOptions;
  seed?: number;
}

const LEGACY_EFFECT_DEFAULT = 'emerald-shimmer';
const BLUR_MODES: readonly LegacyBlurMode[] = ['none', 'uniform', 'lens', 'motion', 'center-focus', 'vignette-blur'];
const warned = new Set<string>();

const warnOnce = (key: string, message: string): void => {
  if (warned.has(key)) return;
  warned.add(key);
  if (typeof console !== 'undefined' && typeof console.warn === 'function') console.warn(message);
};

const canonicalEffect = (name: string): string => V1_ALIASES[name] ?? name;

const legacyPaletteName = (name: string): string => {
  // Preserve the old color intent where V2 repurposed a palette name.
  if (name === 'aurora') return 'borealis';
  if (name === 'supernova') return 'nova';
  return name;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const blurToGlow = (blur: number | undefined, mode: LegacyBlurMode | undefined): number | undefined => {
  if (blur === undefined && mode === undefined) return undefined;
  if (mode === 'none') return 0;
  const px = typeof blur === 'number' && Number.isFinite(blur) ? Math.max(0, blur) : 2;
  // V1's CSS/depth blur has no exact V2 equivalent. Glow is a visual approximation only.
  return clamp01(0.2 + px / 10);
};

const rgbHex = ([r, g, b]: readonly [number, number, number]): string =>
  '#' + [r, g, b].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');

function paletteForLegacy(name: string): { colors: string[]; weights: number[] } | null {
  const mapped = legacyPaletteName(name);
  const p = (palettes as Readonly<Record<string, Palette>>)[mapped];
  return p ? { colors: p.colors.map(rgbHex), weights: [...p.weights] } : null;
}

function mapVisual(config: LegacyGlitterFXConfig, includeDefaults: boolean): GlitterFXUpdate & { effect?: string } {
  const out: GlitterFXUpdate & { effect?: string } = {};

  if (config.effect !== undefined || includeDefaults) out.effect = canonicalEffect(config.effect ?? LEGACY_EFFECT_DEFAULT);
  if (config.size !== undefined) out.size = config.size;
  if (config.density !== undefined) out.density = config.density;
  if (config.brightness !== undefined) out.brightness = config.brightness;
  if (config.speed !== undefined) out.speed = config.speed;
  if (config.haze !== undefined) out.haze = config.haze;
  if (config.renderer !== undefined) out.renderer = config.renderer;
  if (config.quality !== undefined) out.quality = config.quality;
  if (config.glow !== undefined) out.glow = config.glow;
  if (config.opacity !== undefined) out.opacity = config.opacity;
  if (config.params !== undefined) out.params = config.params;
  if (config.interaction !== undefined) out.interaction = config.interaction;
  if (config.motion !== undefined) out.motion = config.motion;
  if (config.seed !== undefined) out.seed = config.seed;

  if (typeof config.palette === 'string') {
    out.palette = legacyPaletteName(config.palette);
  } else if (Array.isArray(config.palette)) {
    warnOnce(
      'custom-palette',
      'GlitterFX legacy adapter: V1 custom palette arrays are not yet supported by the V2 engine. ' +
        'Use a built-in palette name or the exact V1 runtime at dist/legacy/glitterfx.v1.js.',
    );
  }

  const approximatedGlow = blurToGlow(config.blur, config.blurMode);
  if (config.glow === undefined && approximatedGlow !== undefined) {
    out.glow = approximatedGlow;
    warnOnce(
      'blur',
      'GlitterFX legacy adapter: V1 blur/blurMode are approximated with V2 glow. ' +
        'Use the exact V1 runtime when pixel-identical blur behavior is required.',
    );
  }

  if (config.hazeColor !== undefined) {
    warnOnce('haze-color', 'GlitterFX legacy adapter: hazeColor is ignored because V2 haze is palette-tinted.');
  }
  if (config.weights !== undefined) {
    warnOnce('weights', 'GlitterFX legacy adapter: custom palette weights are ignored unless using the exact V1 runtime.');
  }

  return out;
}

export class GlitterFX {
  readonly container: HTMLElement;
  readonly #engine: EngineGlitterFX;
  readonly #initialBackground: string;

  constructor(container: HTMLElement, config: LegacyGlitterFXConfig = {}) {
    this.container = container;
    this.#initialBackground = container.style.background;
    if (config.background !== undefined) container.style.background = config.background;

    const mapped = mapVisual(config, true);
    this.#engine = new EngineGlitterFX(container, {
      effect: mapped.effect ?? LEGACY_EFFECT_DEFAULT,
      renderer: mapped.renderer ?? ['webgl', 'canvas'],
      ...(mapped.quality !== undefined ? { quality: mapped.quality } : {}),
      ...(mapped.density !== undefined ? { density: mapped.density } : {}),
      ...(mapped.speed !== undefined ? { speed: mapped.speed } : {}),
      ...(mapped.size !== undefined ? { size: mapped.size } : {}),
      ...(mapped.brightness !== undefined ? { brightness: mapped.brightness } : {}),
      ...(mapped.glow !== undefined ? { glow: mapped.glow } : {}),
      ...(mapped.haze !== undefined ? { haze: mapped.haze } : {}),
      ...(mapped.opacity !== undefined ? { opacity: mapped.opacity } : {}),
      ...(mapped.params !== undefined ? { params: mapped.params } : {}),
      ...(mapped.interaction !== undefined ? { interaction: mapped.interaction } : {}),
      ...(mapped.motion !== undefined ? { motion: mapped.motion } : {}),
      ...(mapped.palette !== undefined ? { palette: mapped.palette } : {}),
      ...(mapped.seed !== undefined ? { seed: mapped.seed } : {}),
    });
  }

  get renderer() {
    return this.#engine.renderer;
  }

  get config(): GlitterFXConfig {
    return this.#engine.config;
  }

  update(patch: LegacyGlitterFXConfig): void {
    if (patch.background !== undefined) this.container.style.background = patch.background;
    const mapped = mapVisual(patch, false);
    this.#engine.update(mapped);
  }

  setEffect(name: string): void {
    this.#engine.update({ effect: canonicalEffect(name) });
    // V1 effect changes adopted the new effect's defaults rather than carrying stale visual options.
    this.#engine.reset();
  }

  setScale(scale: number): void {
    const safe = typeof scale === 'number' && Number.isFinite(scale) && scale > 0 ? scale : 1;
    this.#engine.update({ size: safe, density: 1 / (safe * safe) });
  }

  async loadConfig(url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GlitterFX legacy adapter: failed to load config (${response.status} ${response.statusText}).`);
    this.update((await response.json()) as LegacyGlitterFXConfig);
  }

  start(): void {
    this.#engine.start();
  }

  stop(): void {
    this.#engine.stop();
  }

  resize(): void {
    this.#engine.resize();
  }

  destroy(): void {
    this.#engine.destroy();
    this.container.style.background = this.#initialBackground;
  }

  static listEffects(): string[] {
    return [...new Set([...effects.map((effect) => effect.id), ...Object.keys(V1_ALIASES)])];
  }

  static getDefaults(name: string): LegacyGlitterFXConfig {
    const canonical = canonicalEffect(name);
    const effect = effects.find((item) => item.id === canonical);
    if (!effect) throw new Error(`GlitterFX legacy adapter: unknown effect "${name}".`);
    return {
      effect: name,
      palette: effect.defaultPalette,
      size: 1,
      density: 1,
      brightness: 1,
      speed: 1,
      blur: 0,
      blurMode: 'none',
      haze: 0,
    };
  }

  static listPalettes(): string[] {
    return Object.keys(palettes);
  }

  static getPalette(name: string): { colors: string[]; weights: number[] } | null {
    return paletteForLegacy(name);
  }

  static listBlurModes(): LegacyBlurMode[] {
    return [...BLUR_MODES];
  }

  static registerPalette(): never {
    throw new Error(
      'GlitterFX legacy adapter: registerPalette is not yet supported by the V2 engine. ' +
        'Use the exact V1 runtime at dist/legacy/glitterfx.v1.js for runtime custom palettes.',
    );
  }

  static registerEffect(): never {
    throw new Error(
      'GlitterFX legacy adapter: registerEffect is not yet supported by the V2 engine. ' +
        'Use the exact V1 runtime at dist/legacy/glitterfx.v1.js for runtime custom effects.',
    );
  }
}

export { GlitterFX as LegacyGlitterFX };
